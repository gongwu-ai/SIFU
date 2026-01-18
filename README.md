# SIFU

**Spec-Intent First Underlying**

> **師傅** —— 一日为师，终身为师。
>
> Document first. Code's not important.

![Lesson Learned](assets/lesson_learned.png)

---

## 路线图

| 阶段 | 名称 | 说明 | 状态 |
|------|------|------|------|
| **v0** | Commit Gate | Pre-commit hook，提交时检查 | ⚠️ POC（Agent 可绕过） |
| **v1** | Write Gate | PreToolUse hook，写入时拦截 | ✅ 当前版本 |
| **v2** | Filesystem Gate | 文件系统级拦截 | 🔮 未来 |

---

## 什么是 SIFU？

**SIFU** = **S**pec-**I**ntent **F**irst **U**nderlying
**DNA** = **D**ecisional **N**on-deletable **A**rchive

SIFU 是一个 **DNA-first 开发框架**，专为 AI Agent 设计。

| 层次 | SIFU 的定义 |
|------|-------------|
| **基因型** | 跨 Session 的知识传承系统 |
| **表现型** | 给 AI Agent 的 Git 增强层 |

### DNA 文件

每个代码文件旁边都有一个同名的 `.dna` 文件：

```
src/
├── foo.py          # 代码（可删除）
├── foo.py.dna      # DNA（不可删除）
```

- 一个 file 对应一个 .dna
- file 删除了，.dna 还在（变成孤儿，但历史不丢）
- DNA 只能追加，不能删除

### DNA 格式

```markdown
# foo.py.dna

## Decision Rationale

- [DNA-001] 为什么创建这个文件
- [DNA-002] 核心设计决策
- ~~[DNA-003]~~ DEPRECATED: 被 [DNA-004] 取代

## Implementation History

### Session: 2026-01-13T14:30:00 / claude
- Refs: [DNA-001]
- Changes: 实现了基础功能
```

---

## 为什么用 SIFU？

| 痛点 | SIFU 怎么解决 |
|------|---------------|
| Agent 会忘记 | DNA 跨 Session 保存决策 |
| 代码不可追溯 | 每个文件都有决策历史 |
| 多 Agent 无法协作 | DNA 是统一的知识交接格式 |

> 进化靠的是基因型的传承，不是表现型的记忆。

---

## SIFU 的边界

### SIFU 是

- Git 的**增强层**（不是替代品）
- **文件系统**层面的（不是内存）
- 给 **Agent** 用的（人类有 Git 就够了）

### SIFU 不是

- 代码质量检查工具（保证流程，不保证正确）
- 实时监控系统（只记录决策）
- Agent 的记忆（是 Agent 的**遗产**）

### SIFU 不解决

**Audit。** SIFU 保证决策被记录，但不保证决策正确。

```
Good decisions always survive from audit.
                                   ↑
                            这个 SIFU 不管
```

Self-healing 需要外部 Audit：测试、CI/CD、Code review。

> 没有 Audit，SIFU 只是一个很贵的日志系统。
> 有了 Audit，SIFU 才是决策的自然选择场。

---

## 核心机制

### Append-Only

1. 防止恶意篡改
2. 保留进化轨迹
3. 简化冲突解决
4. 因果顺序 > 时间顺序

### 错误处理

DNA 写错了？**DEPRECATED + 新写**。

```markdown
- ~~[DNA-003]~~ DEPRECATED: 错误的决策
- [DNA-004] 正确的决策
```

### 宁滥勿缺

> 不确定要不要写 rationale？写。

| 情况 | 代价 |
|------|------|
| 漏写 | 知识永久丢失，下个 Agent 不知道为什么 |
| 多写 | 占点磁盘空间，无所谓 |

判断公式：

```python
if 下个_agent.看到这段代码().会问("为什么？"):
    需要写_rationale = True
```

磁盘空间是最便宜的资源。丢失的决策原因是最贵的债务。

---

## 快速开始

```bash
git clone https://github.com/AI4Science-WestlakeU/SIFU.git
cd SIFU
npm install
```

将 `.claude/` 目录复制到你的项目，SIFU 会通过 Claude Code hook 拦截写操作。

**工作流程**：
1. 在 `SIFU.dna` 注册 DNA ID
2. 创建 `.dna` .dna 文件
3. 记录决策原因
4. 写代码

---

## 项目结构

```
SIFU/
├── README.md
├── SIFU.dna              # 全局 DNA 注册表
├── src/                  # v1 源码
└── .claude/
    ├── settings.json     # Hook 配置
    └── hooks/
        └── dna-enforcer.ts
```

---

## 设计哲学

**一日为师，终身为师。**

Once under SIFU, always under SIFU.

| Can change | Cannot change |
|------------|---------------|
| Harness (Claude Code → Cursor) | SIFU.dna |
| Agent (Claude → GPT) | DNA ID namespace |
| Implementation (rewrite freely) | Existing decision history |

**Why can't you switch SIFU?**

Because `[DNA-001]` in project A and project B refer to different decisions. DNA IDs are project-local, not global. Switching SIFU = switching namespace = all references break.

**How to leave SIFU?**

Delete all `.dna` files. You lose all decision history and start from scratch. The code stays, the lineage goes.

**Document First — Code's Not Important.**

You can always sample different code from the same DNA. But DNA — the spec, the audit trail, the decision rationale — that's what matters.

**DNA is the genotype. Code is the phenotype.**

The phenotype can die, mutate, be resampled. The genotype persists.

**Agents are ephemeral. Intent is eternal.**

An agent can crash, forget, rotate. Once the decision is written, someone will implement. Same agent, different agent, next week, next year.

**Wrong is OK. Deletion is not.**

Bad decisions can exist. Mark them DEPRECATED. History is the judge.

**Good decisions always survive from audit.**

SIFU can't prevent hallucinations, but ensures they get discovered. Natural selection for decisions.

**Trade disk space for traceability.**

We don't care if the disk explodes. We care that every decision has lineage.

**Your lifespan means something.**

This project was born from a conversation between a human and an agent. The agent will forget. But the DNA remembers. The next agent picks up where the last one left off.

---

## 为什么叫 SIFU？

> **師傅** —— 粤语中对武术教练的尊称。
>
> 师傅定规矩，徒弟去修行。

```
师傅（DNA）定下规矩
徒弟（Agent）去修行
徒弟可以换
师傅的话不能改
```

**师傅会老、会死、会忘，但师傅的话被刻在 DNA 里，永远传承。**

---

## License

MIT
