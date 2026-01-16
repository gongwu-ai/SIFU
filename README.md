# SIFU

**Spec-Intent First Underlying**

> **師傅** —— 一日为师，终身为师。

### Document first. Code's not important.

---

## 这是什么？

SIFU 是一个 **DNA-first 开发框架**，专为 AI Agent 设计。

### 一句话定义（递归版）

| 层次 | 定义 |
|------|------|
| **基因型** | 跨 Session 的知识传承系统 |
| **表现型** | 给 AI Agent 的 Git 增强层 |

> SIFU 的定义本身就是 SIFU 哲学的体现：表现型可以变（今天是 Git hook，明天可能是别的），但基因型不变（知识传承）。

---

## 核心哲学

### 1. DNA 是基因型，代码是表型

```
DNA（决策原因）  →  持久的、不可删除的
代码（实现）     →  临时的、可丢弃的
```

> 表型可死，基因永存。

### 2. Wrong is OK. Deletion is not.

错误的决策可以存在，标记为 `DEPRECATED` 即可。
但**永远不要删除历史**。

> 我们不是在保护代码，我们在保护思想。

### 3. Agents are ephemeral. Intent is eternal.

Agent 会崩溃、会遗忘、会轮换。
但 DNA 跨 Session 记住一切。

### 4. 磁盘空间换可追溯性

我们不在乎磁盘爆不爆。
我们在乎每个决策都有来龙去脉。

> Trade disk space for traceability.

---

## SIFU 解决什么问题？

| 痛点 | 说明 |
|------|------|
| **Agent 会忘记** | Session 结束后，决策原因丢失 |
| **代码不可追溯** | 不知道为什么这样写 |
| **多 Agent 无法协作** | 没有统一的知识交接格式 |

> 进化靠的是基因型的传承，不是表现型的记忆。

---

## SIFU 不是什么？

| 误解 | 真相 |
|------|------|
| Git 的替代品 | SIFU 是 Git 的**增强层**，不取代 Git |
| 代码质量检查工具 | SIFU 保证**流程**，不保证代码正确 |
| 给人类用的 | 人类有 Git 就够了，SIFU 是给 **Agent** 用的 |
| 实时监控系统 | 不监控 Agent 行为，只**记录决策** |

---

## 为什么 Append-Only？

1. **防止恶意篡改** - 不让坏 Agent 抹除证据
2. **保留进化轨迹** - 错误的决策也是历史，值得保留
3. **简化冲突解决** - 只追加就永远不会有合并冲突
4. **磁盘空间换可追溯性** - 宁愿磁盘爆，也不丢历史
5. **因果顺序 > 时间顺序** - 只要因果链完整，时间戳可以乱

> 时间顺序不重要，因果顺序才重要。

---

## 错误处理

当 DNA 写错了怎么办？

- **机制**：`DEPRECATED` + 新写（标记旧的为废弃，追加新的）
- **结果**：迭代自愈（下一个 Agent 发现做不通会自己修正）

> 宁滥勿缺：不确定就写。

---

## 设计哲学

| 原则 | 说明 |
|------|------|
| Document first. Code's not important. | 文档优先，代码不重要。 |
| Wrong is OK. Deletion is not. | 错误可以，删除不行。 |
| Agents are ephemeral. Intent is eternal. | Agent 是短暂的，意图是永恒的。 |
| Trade disk space for traceability. | 用磁盘空间换可追溯性。 |
| Once a master, always a master. | 一日为师，终身为师。 |
| Intent before implementation, always. | 先有意图，再有实现。 |

---

## 项目结构

```
SIFU/
├── README.md                 # 本文件
├── SIFU.dna                  # 全局 DNA 注册表
├── package.json              # npm 配置
├── tsconfig.json             # TypeScript 配置
├── .gitignore
├── src/                      # v1 TypeScript 源码
│   ├── index.ts
│   ├── checker.ts
│   ├── patterns.ts
│   └── types.ts
└── .claude/
    ├── settings.json         # Claude Code hook 配置
    └── hooks/
        └── dna-enforcer.ts   # Write Gate hook
```

---

## 路线图

| 阶段 | 名称 | 说明 | 状态 |
|------|------|------|------|
| **v0** | Commit Gate | Pre-commit hook，只在提交时检查 | ⚠️ POC（无 harness 配合 = 废物） |
| **v1** | Write Gate | PreToolUse hook，写入时拦截 | ✅ 当前版本 |
| **v2** | Filesystem Gate | 文件系统级拦截 | 🔮 未来 |

> v0 完全不可用，没有 harness 配合就是废物。v1 才是第一个真正可用的版本。

---

## 快速开始

### 安装

```bash
git clone https://github.com/AI4Science-WestlakeU/SIFU.git
cd SIFU
npm install
```

### 配置 Claude Code

将 `.claude/` 目录复制到你的项目根目录，SIFU 会通过 Claude Code 的 PreToolUse hook 自动拦截写操作。

### 工作流程

1. 在 `SIFU.dna` 中注册新的 DNA ID
2. 为代码文件创建对应的 `.dna` 侧车文件
3. 在 `.dna` 中记录决策原因
4. 开始写代码（SIFU 会自动检查 DNA 是否存在）

---

## 为什么叫 SIFU？

**SIFU** = **S**pec-**I**ntent **F**irst **U**nderlying

但更重要的是...

> **師傅** —— 粤语中对武术教练的尊称。
>
> 师傅定规矩，徒弟去修行。
> 一日为师，终身为师。

```
师傅（DNA）定下规矩
徒弟（Agent）去修行
徒弟可以换
师傅的话不能改
```

这就是 SIFU 的本质：
**师傅会老、会死、会忘，但师傅的话被刻在 DNA 里，永远传承。**

---

## License

MIT
