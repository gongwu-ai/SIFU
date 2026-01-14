# R5 实验设计

**目标**: 修复 R4 实验缺陷，正确验证 SIFU DNA 机制的价值

---

## R4 实验问题

### 问题 1: 实验污染

R4 脚本没有 `--cwd` 参数：
```bash
# R4 (有问题)
claude --model haiku --print ... -p "$PROMPT"
```

脚本从 `/Users/wenhaodeng/Desktop/Sifu` 目录运行，导致：
- **所有 agent 都读取了 SIFU 项目的 CLAUDE.md**
- Agent 因此知道了 DNA 格式规范 `[DNA-###]`
- Baseline 和 SIFU 都受到污染

**证据**：Run3 的 DNA 格式与 CLAUDE.md 规范完全一致
```markdown
## Decision Rationale
- [DNA-001] Use Trafilatura library...
- [DNA-002] Output format: plain text...

## Implementation History
### Session: 2026-01-13T22:30:00 / claude-haiku-4-5
- Refs: [DNA-001], [DNA-002]
- Changes: ...
```

### 问题 2: DNA 变成迭代日志

- Run2 (97行, 失败): 每次迭代尝试都写成新 DNA (`[DNA-029]` ~ `[DNA-036]`)
- Run3 (26行, 成功): 只有 3 条核心设计决策

---

## 重要发现: CLAUDE.md 的价值

R4 实验意外证明了 **CLAUDE.md 的重要性**：
- 它提供了 DNA 格式规范
- Agent 读取后能正确写出结构化 DNA
- 没有 CLAUDE.md，agent 可能自由发挥

**结论**：R5 必须在 prompt 中包含格式规范（因为隔离后读不到 CLAUDE.md）

---

## R4 数据不能复用

| 原因 | 说明 |
|------|------|
| 实验污染 | Baseline 和 SIFU 都读取了 CLAUDE.md |
| 无法隔离 | 无法区分"知道规范"和"不知道规范"的效果 |
| 需要重跑 | R5 必须用 `--cwd` 隔离后重新跑两个条件 |

---

## 核心概念

| 概念 | 本质 | 隐喻 | 持久性 |
|------|------|------|--------|
| **DNA** | 文件本体的痕迹 | Genotype | Append-only |
| **HANDOFF.md** | Agent 前世的记忆 | Phenotype | 每轮覆盖 |

**关键区分**：
- **DNA**: "这个文件经历了什么" — 关于**代码**的历史
- **HANDOFF.md**: "我上一世做了什么" — 关于**agent**的经验

---

## R5 实验配置

| 参数 | 值 |
|------|-----|
| 执行模型 | Claude Haiku |
| 任务 | NeuroKit_03, Trafilatura_01, PDFPlumber_02 |
| 重复次数 | 5 |
| 最大迭代 | 8 |
| 条件 | Baseline / SIFU |
| 总 runs | 3 tasks × 5 runs × 2 conditions = 30 runs |

---

## 关键修复: `--cwd` 隔离

```bash
# R4 (有问题 - 读取了 SIFU 项目的 CLAUDE.md)
claude --model haiku --print ... -p "$PROMPT"

# R5 (修复 - 隔离到实验工作目录)
claude --model haiku --print --cwd "$workdir" ... -p "$PROMPT"
```

---

## 工作目录结构

```
/tmp/sifu-test/r5/{condition}/{task}_run{N}/
├── HANDOFF.md         ← Agent 经验 (每轮覆盖，两者都有)
├── code.py            ← 代码
└── code.py.dna        ← 文件痕迹 (SIFU only)
```

---

## Prompt Template

### 通用部分 (两者相同)

```
任务：{TASK_DESC}

工作目录：{WORKDIR}
输入文件目录：{INPUT_DIR}
参考仓库：{CODE_BASE}
输出文件：{WORKDIR}/output.{GT_EXT}
```

### HANDOFF 块 (两者相同)

```
完成后，将交接信息写入 HANDOFF.md：
- STATUS: done / blocked / partial
- DONE: 完成了什么
- ISSUE: 遇到什么问题
- NEXT: 建议下一步
```

### DNA 块 (SIFU 独有)

```
修改代码时，创建/更新对应的 .dna 文件。

DNA 原则：
- DNA-first：先写决策，再写代码
- 代码可删，DNA 不可删（append-only）
- 错了标记 DEPRECATED，写新决策
- 宁滥勿缺：不确定要不要写？写！

何时写 DNA：
- 如果未来 agent 看到这段代码会问"为什么？"→ 需要写
- 不确定？写！

DNA 内容：
- 记录文件的设计决策以及决策历史
- 为什么这样写
- 为什么发生改变
- 每个决策为一条 [DNA-###]

DNA 格式：
# {filename}.dna

## Decision Rationale
- [DNA-001] 第一个设计决策...
- [DNA-002] 第二个设计决策...
- ~~[DNA-003]~~ DEPRECATED: 原因，被 [DNA-004] 替代
- [DNA-004] 新的设计决策...

## Implementation History
### Session
- Refs: [DNA-001], [DNA-002], [DNA-004]
- Changes: 做了什么改动 (10-50 words)

## Misc
(可选，备注信息)

格式要求：
- Decision Rationale 必须有，至少一条 [DNA-###]
- Implementation History 必须有，可以为空
- Misc 可选
```

---

## Prompt 组合

### Iter 1

**Baseline**:
```
{通用部分}

{HANDOFF 块}
```

**SIFU**:
```
{通用部分}

{DNA 块}

{HANDOFF 块}
```

### Iter N (N > 1)

**Baseline**:
```
{通用部分}

上轮测试结果：{FEEDBACK}
工作目录里有 HANDOFF.md（上轮的交接信息）。

完成后，更新 HANDOFF.md。
```

**SIFU**:
```
{通用部分}

上轮测试结果：{FEEDBACK}
工作目录里有 HANDOFF.md（上轮的交接信息）。

{DNA 块}

完成后，更新 HANDOFF.md。
```

---

## 对比总结

| 维度 | Baseline | SIFU |
|------|----------|------|
| HANDOFF.md | ✅ 有 | ✅ 有 |
| Handoff Prompt | 相同 | 相同 |
| .dna 文件 | ❌ 无 | ✅ 有 |
| DNA Prompt | 无 | 有 (完整规范) |

**唯一差异**: SIFU 有 DNA + DNA 相关的 prompt 指引

---

## 实验结果

*(待填写)*
