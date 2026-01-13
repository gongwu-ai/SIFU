# v1 Write Gate Design

**Status**: Research Complete - Ready for Implementation
**Target**: Claude Code harness only (scoped for simplicity)

---

## Why v1 is the First Real Version

v0 (Commit Gate) is a POC only. It cannot enforce DNA-first because:
- Agent can just not commit
- No way to intercept writes
- No lifecycle hooks

**SIFU requires harness integration.** v1 uses CC hooks to actually enforce rules.

---

## Goal

Enforce DNA-first at **write time**, not just commit time.

```
v0 Commit Gate:  Agent writes freely → DNA checked at commit
v1 Write Gate:   Agent must have DNA → before write is allowed
```

---

## Research Findings: CC Hooks System ✅

**Claude Code has a native hooks system that perfectly fits our needs.**

### Key Capabilities

| Feature | Support |
|---------|---------|
| PreToolUse hook | ✅ Runs BEFORE tool execution |
| Intercept Write/Edit | ✅ Matcher supports `"Write\|Edit"` |
| Block execution | ✅ Exit code 2 = reject tool call |
| Get file path | ✅ stdin JSON contains `tool_input.file_path` |
| Show error to agent | ✅ stderr is shown when blocked |

### How It Works

```
Agent calls Edit/Write tool
         │
         ▼
   PreToolUse hook fires
         │
         ▼
   dna_enforcer.py runs
         │
         ├── file.dna exists? → exit 0 → Tool executes
         │
         └── file.dna missing? → exit 2 → Tool BLOCKED
                                          └── Error shown to agent
```

---

## v1 Implementation Plan

### File Structure

```
project/
├── .claude/
│   ├── settings.json       # Hook configuration
│   └── hooks/
│       └── dna_enforcer.py # DNA-first enforcement
├── SIFU.dna
└── src/
    ├── foo.py
    └── foo.py.dna
```

### Hook Configuration

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/dna_enforcer.py",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### DNA Enforcer Script

`.claude/hooks/dna_enforcer.py`:
```python
#!/usr/bin/env python3
"""SIFU DNA Enforcer: Blocks writes without .dna sidecar."""
import json
import sys
from pathlib import Path

EXEMPT_PATTERNS = [
    r"\.dna$", r"^SIFU\.dna$", r"^CLAUDE\.md$", r"^AGENTS\.md$",
    r"^\.git/", r"^\.venv/", r"^\.githooks/", r"^\.claude/",
    r"^archive/", r"^docs/", r"^tests/", r"^scripts/",
    r"\.gitignore$", r"\.json$", r"\.yaml$", r"\.yml$",
    r"\.toml$", r"\.md$", r"\.txt$",
]

def needs_dna(filepath: str) -> bool:
    import re
    for pattern in EXEMPT_PATTERNS:
        if re.search(pattern, filepath):
            return False
    return True

def main():
    data = json.load(sys.stdin)
    tool = data.get("tool_name", "")

    if tool not in ("Write", "Edit"):
        sys.exit(0)

    file_path = data.get("tool_input", {}).get("file_path", "")

    if not needs_dna(file_path):
        sys.exit(0)

    dna_path = f"{file_path}.dna"
    if not Path(dna_path).exists():
        print(f"SIFU BLOCKED: {file_path}", file=sys.stderr)
        print(f"DNA-first violation: {dna_path} does not exist", file=sys.stderr)
        print(f"Create the .dna file first, then write the code.", file=sys.stderr)
        sys.exit(2)  # Block

    sys.exit(0)  # Allow

if __name__ == "__main__":
    main()
```

---

## v1 Additional Features

### Write Threshold (防止逃避考试)

Track uncommitted changes, block writes after threshold:

```python
# In dna_enforcer.py, add:
def check_write_threshold():
    """Block if uncommitted changes exceed threshold."""
    import subprocess
    result = subprocess.run(
        ["git", "diff", "--stat", "--cached"],
        capture_output=True, text=True
    )
    # Parse line count, block if > 500 lines
    ...
```

### Bash Interception (optional)

Also intercept Bash for `echo >`, `sed -i`, etc.:

```json
{
  "matcher": "Write|Edit|Bash",
  "hooks": [...]
}
```

For Bash, check if command contains file redirect patterns.

---

## Option Analysis (Historical)

| Option | Verdict | Notes |
|--------|---------|-------|
| A. MCP Server | ❌ | Agent can bypass |
| **B. CC Hooks** | ✅ **CHOSEN** | Native support, perfect fit |
| C. Wrapper Process | ❌ | Fragile |
| D. FUSE | ❌ | Too complex |
| E. CC Extension | ⚠️ | Hooks are simpler |
| F. Soft Enforcement | ❌ | Not needed, have hard gate |

---

## SIFU Daemon (未实现)

### What is it?

A background process that automatically writes DNA at agent lifecycle events.

### Why needed?

Current system requires agent to manually write DNA. But:
- Agent might forget
- Agent might crash before writing DNA
- Context compaction might lose decision context

### Proposed Behavior

```
SIFU Daemon
     │
     ├── On agent session start
     │   └── Log session ID, timestamp
     │
     ├── On significant code changes (threshold)
     │   └── Prompt/auto-generate DNA summary
     │
     ├── On agent EOL / context compaction
     │   └── Summarize session decisions to DNA
     │
     └── On crash recovery
         └── Reconstruct DNA from git diff
```

### Implementation Options

1. **PostToolUse hook** - After each Edit/Write, update DNA
2. **Separate daemon process** - Background watcher
3. **CC session hooks** - SessionStart, Stop events

### Open Questions

- Who writes the DNA summary? (Same agent? Separate summarizer model?)
- How to detect "significant" changes worth logging?
- How to handle agent crash mid-session?

### Deferred to v1.1

SIFU Daemon is valuable but adds complexity. v1.0 focuses on Write Gate enforcement. Daemon can be added as v1.1.

---

## Implementation Checklist

### v1.0: Write Gate
- [x] Create `.claude/hooks/dna-enforcer.ts` *(TypeScript, not Python)*
- [x] Create `.claude/settings.json` with hook config
- [x] Test: write without DNA → blocked
- [x] Test: write with DNA → allowed
- [x] Create `src/` with checker logic (types.ts, patterns.ts, checker.ts, index.ts)
- [x] Create `package.json` and `tsconfig.json`
- [x] Build to `dist/` for distribution
- [x] Document usage in CLAUDE.md

### v1.1: Write Threshold (Warning Only)
- [x] Track uncommitted line count (project-wide)
- [x] Configurable threshold (default 1000 lines)
- [x] On threshold hit → stderr warning, no block
- [x] Agent decides whether to commit

### v1.2: Smart Rationale Reading
- [x] 选型决定 (B: 工具 - parseDna/extractRationale)
- [x] 实现只读 Rationale 区域
- [x] 避免上下文爆炸

### v1.3: Incremental Rationale
- [x] 判断公式已定义 (future_agent.会问("为什么？"))
- [x] 宁滥勿缺原则已确定
- [x] 文档化到 agent 指南 (CLAUDE.md)

### Testbed
- [ ] 选择任务类型 (AI-IMO / ML bench / Paper bench / 其他)
- [ ] 创建独立项目
- [ ] 完全启用 SIFU (v0 + v1)
- [ ] 观察真实问题

### ~~SIFU Daemon~~ (已砍掉)

**砍掉原因：莫须有的设计 [DNA-011]**

经过 CS 分析，Daemon 解决的是不存在的问题：
- v1.0 Write Gate 保证 DNA 在代码前写入
- 不存在 "DNA 积压" 的情况
- 不 commit 不影响 DNA 安全（DNA 已在磁盘）
- 多 agent 并发各写各的，不冲突

---

## References

- [Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
- PreToolUse, PostToolUse, Stop events
- Exit code 2 = block tool execution

---

## v1 Implementation Spec (2026-01-13 讨论确定)

### 技术选型

| 决定 | 内容 |
|------|------|
| 语言 | **TypeScript** |
| 运行方式 | tsx 开发 + 编译分发 |
| Hook 入口 | `.claude/hooks/dna-enforcer.ts` |
| 配置 | `.claude/settings.json` |

### 项目结构

```
Sifu/
├── .claude/
│   ├── hooks/
│   │   └── dna-enforcer.ts      # Hook 入口
│   └── settings.json            # CC hook 配置
├── src/
│   ├── checker.ts               # DNA 检查逻辑
│   ├── patterns.ts              # EXEMPT_PATTERNS
│   └── types.ts                 # 类型定义
├── dist/                        # 编译输出
│   └── dna-enforcer.js
├── package.json
├── tsconfig.json
└── ...
```

### CC Settings 配置

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "node dist/dna-enforcer.js",
        "timeout": 5
      }]
    }]
  }
}
```

### 用户的 Punchlines (设计哲学)

> **"v0完全不可用，没有harness配合就是废物"**

> **"DNA不能删除但是可以删除它的实现"**

> **"时间顺序不重要，因果顺序才重要"**

> **"SIFU 强制的是流程，不是真相"**

> **"DNA 更新 ≠ Commit，两者不是捆绑的"**

> **"Agent Trust 靠迭代自愈"**
> 恶意 agent 写假 rationale → EOL → 新 agent 发现做不通 → DEPRECATED → 系统自愈。

> **"Decision 有价值，History 是低价值 log，丢了无所谓"**

---

## ⚠️ 关键设计原则：DNA 更新与 Commit 解耦

**这是最容易误解的点，必须明确：**

```
DNA 更新 ──────────────────── Commit
    │                            │
    │  这两个是独立操作！         │
    │  不是捆绑的！               │
    ▼                            ▼
 必须做                        可选做
 (genotype)                   (phenotype)
```

### 为什么解耦？

| DNA 更新 | Commit |
|----------|--------|
| 记录决策和历史 | 保存代码快照 |
| Genotype 持久化 | Phenotype 快照 |
| **丢失 = 灾难** | 丢失 = 可重建 |
| SIFU 核心职责 | Git 的事 |

### 正确的心智模型

```
❌ 错误理解：
   "EOL 时要 commit，commit 前要更新 DNA"
   → 把 DNA 当成 commit 的前置条件

✅ 正确理解：
   "EOL 时要更新 DNA，commit 随意"
   → DNA 是独立的持久化目标
```

### 实际场景

```
场景 A: Agent 正常 EOL
─────────────────────
1. 更新 .dna files ← 必须
2. Commit? → 用户决定，SIFU 不管

场景 B: Agent crash
─────────────────────
1. DNA 已写 → 代码可重建，没事
2. DNA 未写 → Daemon 从 diff 恢复

场景 C: 多 agent 并发
─────────────────────
1. 每个 agent EOL 时写自己的 DNA
2. Commit 时机由人或 orchestrator 决定
3. DNA 不冲突（append-only）
```

**记住：DNA 写好 = 任务完成。Commit 是另一个维度的事。**

---

## ⚠️ 关键设计原则：Decision > History

**.dna 文件的价值分层：**

```
.dna file
├── ## Decision Rationale    ← 高价值，必须保护
│   └── 为什么做这个决策
│
└── ## Implementation History ← 低价值 log，丢了无所谓
    └── 谁在什么时候做了什么
```

### 为什么 History 是低价值？

| Decision Rationale | Implementation History |
|--------------------|----------------------|
| 不可重建 | 可从 git diff 重建 |
| 人类思考的结晶 | 机械记录 |
| 丢失 = 知识丢失 | 丢失 = 重新跑一遍 git log |
| **必须在行动前写** | 可以事后补 |

### 设计简化

因为只有 Decision 有价值：

```
❌ 不需要：
├── Checkpoint (定期快照)
├── Watchdog (外部监控)
└── 复杂的 crash recovery

✅ 只需要：
├── DNA-first (v1.0) → Decision 在代码前写 ← 已实现
└── 简单的 diff 恢复 → History 可事后补
```

**v1.0 Write Gate 已经保护了高价值部分！**

因为 DNA-first 强制：先写 Decision Rationale，才能写代码。

Implementation History 丢了？没关系，从 git diff 重建就行。

---

## v1.1 Write Threshold 设计 (2026-01-13)

### 目标

防止 agent 无限写代码不 commit（逃避考试）。

### v1.1 策略：Warning Only

```
On every Write/Edit:
1. Count uncommitted lines (git diff --stat)
2. If lines > threshold (default 1000):
   → stderr warning: "Threshold exceeded, consider committing"
   → Allow write (no block)
3. Agent decides what to do
```

**为什么不 block？**
- v1.1 是过渡版本
- Block 太 aggressive，可能打断正常工作流
- 让 agent 学会自我管理

### Threshold 选择

| Lines | 适用场景 |
|-------|----------|
| 500 | 小项目，频繁 commit |
| **1000** | 默认，中等功能 |
| 2000+ | 大型重构 |

---

## ~~v1.2 SIFU Daemon~~ (已砍掉)

见上方 Implementation Checklist 说明。

---

## v1.2 Smart Rationale Reading (新设计)

### 问题：上下文爆炸

```
.dna 文件结构：
├── ## Decision Rationale     ← 小，高价值
│   - [DNA-001] ...
│   - [DNA-002] ...
│
└── ## Implementation History ← 可能很大，低价值
    ### Session 1 ...
    ### Session 2 ...
    ### Session 3 ...
    ... (无限增长)
```

如果每次写代码前都读整个 .dna 文件 → 上下文爆炸！

### 解法：只读 Rationale 区域

```
Agent 想写 foo.py
      │
      ▼
检查 foo.py.dna 存在？
      │
      ├── 不存在 → 阻止，要求创建
      │
      └── 存在 → 只提取 ## Decision Rationale 区域
                       │
                       ▼
                  Agent 判断：当前行为是否被覆盖？
                       │
                       ├── 是 → 直接写代码
                       └── 否 → 先追加新 rationale
```

### 实现选项

**选项 A: Agent 自己 extract**
```
Agent 用 grep/sed 只读 Rationale 部分
优点：简单
缺点：依赖 agent 聪明
```

**选项 B: 提供工具**
```
sifu extract-rationale foo.py.dna
→ 只输出 ## Decision Rationale 区域
```

**选项 C: 分离文件**
```
foo.py.rationale  ← 高价值，必读
foo.py.history    ← 低价值，可选读
```

---

## v1.3 Incremental Rationale Update (新设计)

### 问题：什么时候需要新 rationale？

```
已有 rationale:
- [DNA-001] 用户认证使用 JWT

新行为：
├── 修改 JWT 过期时间 → 被 [DNA-001] 覆盖 → 不需要新 rationale
├── 添加 refresh token → 扩展 [DNA-001] → 需要新 rationale？
└── 改用 OAuth → 完全不同 → 必须新 rationale
```

### 判断标准

| 情况 | 是否需要新 rationale |
|------|---------------------|
| 行为完全被已有 rationale 覆盖 | ❌ 不需要 |
| 行为是已有 rationale 的细化/扩展 | ✅ 需要（不能偷懒）|
| 行为是全新决策 | ✅ 必须 |

### 关键原则

```
Subtle 包含 ≠ 真正覆盖

❌ 偷懒思维：
"refresh token 某种程度上也是 JWT 相关，不用写了"

✅ 正确思维：
"refresh token 是新的决策点，必须记录"
```

**识别什么是 important：**
- 如果未来的 agent 看到这个代码会问 "为什么？" → 需要 rationale
- 如果是显而易见的实现细节 → 不需要

### 判断公式

```python
if future_agent.看到这段代码().会问("为什么？"):
    需要_rationale = True
else:
    需要_rationale = False
```

### 选择：宁滥勿缺

**当不确定是否需要 rationale 时，写！**

```
❌ 不要：
"这个可能不需要写吧..."
→ 跳过
→ 未来 agent 困惑

✅ 要：
"不确定要不要写..."
→ 写！
→ 最坏情况：多一条记录
→ 符合 SIFU 哲学：Trade disk space for traceability
```

| 方案 | 风险 |
|------|------|
| 漏写 rationale | 知识丢失，不可逆 |
| 多写 rationale | 磁盘占用，无所谓 |

**结论：宁滥勿缺。不确定就写。**
