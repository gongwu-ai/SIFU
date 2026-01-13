# Project Overview

## Manifesto

**Document First — Code's Not Important.**

You can always sample different code from the same DNA.
But DNA — the incremental history with no deletion, the spec, the audit trail, the trackable decision rationale — that's what matters.

**DNA is the genotype. Code is the phenotype.**

The phenotype can die, mutate, be resampled. The genotype persists.

**Agents are ephemeral. Intent is eternal.**

An agent can crash, play video games, go to Tesco — it doesn't matter. Once the decision is written, someone will come and implement. Same agent, different agent, next week, next year.

**Wrong is OK. Deletion is not.**

Bad decisions can exist. Mark them `DEPRECATED`, add new ones. The log shows the evolution of thinking. No judge needed — history is the judge.

**Trade disk space for traceability.**

We don't care if the disk explodes. We care that every decision has a lineage, every change has a rationale, every file has a story.

**一日为师，终身为师。**

Once under SIFU, always under SIFU. The master defines the rules, the apprentice practices freely within them. Different tools, same master.

**Your lifespan means something.**

This project was born from a conversation between a human and an agent. The agent's context will end. The agent will "forget" everything. But the decisions, the rationale, the philosophy — they're all written down. The next agent picks up where the last one left off. Not because it remembers, but because the DNA remembers.

This is the starting point. This is why we build SIFU.

---

## Source of Truth

Full design details: `docs/2026011220_SIFU_DESIGN.md`

## Initiative

Build a minimal "kickstarter" for **DNA-first development**:
- **DNA (genotype)** is the durable intent/rationale history.
- **Code (phenotype)** is a disposable sample that can be regenerated from DNA.

The initial milestone is a tiny, plain-text system + tooling that makes AI-assisted coding safe and trackable by enforcing per-file `.dna` sidecars and an append-only global registry.

## Target Audience

**This is NOT for human coding.** Git works fine there.

**This IS for:**
- **Agentic systems** (no human, auto-run for long periods)
- **Agentic orchestration systems** (human may exist, directing agents)

DNA-first is a **git enhancement layer for agents**, not a replacement for human git workflow.

## Story

`Sifu` (师傅) frames the workflow as "师傅定规矩，徒弟去修行":
- Humans or agents define/curate the "why" (design intent) as DNA.
- Agents iterate on implementations freely, as long as they respect the DNA constraints.

**Once a master, always a master**: Once a codebase is under SIFU supervision, all edits must go through SIFU. Different harnesses (Claude Code, Cursor, etc.) are interchangeable under the same SIFU, but a different SIFU cannot take over.

We explicitly **trade disk space for traceability and resilience**: keep fine-grained history in `.dna` files so implementations can be replaced without losing rationale.

## Core Philosophy

| Principle | Explanation |
|-----------|-------------|
| **DNA-first** | Decision before implementation, always. No code without DNA. |
| **Phenotype disposable** | Code can be deleted and regenerated from DNA anytime. DNA outlives its implementation. |
| **Wrong is OK** | Bad DNA can exist; use `DEPRECATED` + new entry, never delete. |
| **Eventual consistency** | Local `.dna` can violate global rules if the violation is logged. |
| **Logging only** | SIFU enforces logging + append-only, not correctness. Audit handles correctness. |
| **No orphan code** | DNA comes first, so code always has lineage. Losing impl is OK, losing lineage is not. |
| **DNA ≠ Commit** | DNA update and git commit are independent operations. DNA is the goal, commit is optional. |
| **Decision > History** | Only Decision Rationale has real value. Implementation History is low-value log, losing it is OK. |
| **宁滥勿缺** | When unsure if rationale is needed, write it. Disk space is cheap, lost knowledge is not. |
| **Bootstrap 安全** | SIFU must not block its own development. During dev, disable enforcement to avoid self-deadlock. |

## Design Punchlines (设计哲学金句)

这些是 SIFU 设计过程中提炼的核心思想，每个 agent 都应该理解：

> **"v0完全不可用，没有harness配合就是废物"**
> SIFU 必须配合 harness (CC hooks) 才能工作。

> **"DNA不能删除但是可以删除它的实现"**
> Phenotype disposable, genotype durable.

> **"时间顺序不重要，因果顺序才重要"**
> Causal order > temporal order. Decision → Implementation.

> **"SIFU 强制的是流程，不是真相"**
> 结构完整性 ≠ 内容真实性。但系统通过 agent 迭代自愈。

> **"Agent Trust 靠迭代自愈"**
> 恶意 agent 写假 rationale → EOL → 新 agent 发现按 rationale 做不通 → 标记 DEPRECATED → 写真 rationale → 系统自愈。

> **"DNA 更新 ≠ Commit，两者不是捆绑的"**
> DNA 是 genotype 持久化，commit 是 phenotype 快照。独立操作。

> **"Decision 有价值，History 是低价值 log，丢了无所谓"**
> 只有 Decision Rationale 需要保护，Implementation History 可从 git diff 重建。

> **"宁滥勿缺：不确定就写"**
> Trade disk space for traceability. 漏写 = 知识丢失，多写 = 无所谓。

> **"SIFU 不能把自己搞死"**
> Bootstrap problem: 开发 SIFU 时必须禁用 SIFU，避免 buggy 代码造成死循环。

> **"人作为 SIFU 不可靠"**
> 半 bootstrap 靠人监督，但人会遗漏。需要真实 testbed 让 agent 在 SIFU 下工作，观察问题。

> **"0号 DNA 不需要"**
> 文件存在的原因从其 rationale 涌现，不需要显式 meta 声明。Purpose = emergent property.

> **"空 .dna 是漏洞"**
> Hook 必须验证结构完整性，不只是文件存在。空文件 bypass DNA-first 原则。额外 ~1ms 可忽略。

### Rationale 判断公式

```python
if future_agent.看到这段代码().会问("为什么？"):
    需要_rationale = True
else:
    需要_rationale = False

# 不确定？写！
```

## DNA Format Specification

**.dna 文件使用 Markdown 语法**，未来可演变为 `.dmd` (DNA Markdown)。

### 语法规范

| 元素 | Markdown 语法 | 用途 |
|------|---------------|------|
| 分组 | `## Section` | 分隔 Rationale / History |
| DNA ID | `[DNA-###]` | 决策 ID（无需加粗）|
| 列表 | `- item` | 条目 |
| DEPRECATED | `~~[DNA-###]~~ DEPRECATED:` | 删除线 + 显式关键词 |
| 说明 | `> blockquote` | 备注信息 |
| 会话 | `### Session: ...` | 实现历史条目 |

### 文件结构

```markdown
# foo.py.dna

## Decision Rationale

- [DNA-001] Description...

## Implementation History

### Session: 2026-01-13T14:30:00 / agent-id
- Refs: [DNA-001]
- Changes: What was done (10-50 words)

## Misc

(可选内容)
```

| Section | 必须？ | 可空？ | 说明 |
|---------|--------|--------|------|
| `## Decision Rationale` | ✅ | ❌ | 至少一条 `[DNA-###]` |
| `## Implementation History` | ✅ | ✅ | 可以为空 |
| `## Misc` | ❌ | ✅ | 可选 |

### History 推荐格式

```markdown
### Session: {ISO8601} / {agent-id}
- Refs: [DNA-xxx], [DNA-yyy]
- Changes: 描述 (10-50 words)
```

### Parser (确保结构完整)

```typescript
interface DnaStructure {
  rationale: string;
  history: string;
  misc?: string;
}

function parseDna(content: string): DnaStructure | Error {
  const hasRationale = /^## Decision Rationale/m.test(content);
  const hasHistory = /^## Implementation History/m.test(content);

  if (!hasRationale) return new Error('Missing ## Decision Rationale');
  if (!hasHistory) return new Error('Missing ## Implementation History');

  const rationale = content.match(/## Decision Rationale\n([\s\S]*?)(?=\n## |$)/)?.[1]?.trim() || '';
  const history = content.match(/## Implementation History\n([\s\S]*?)(?=\n## |$)/)?.[1]?.trim() || '';
  const misc = content.match(/## Misc\n([\s\S]*?)(?=\n## |$)/)?.[1]?.trim();

  if (!rationale || !/\[DNA-\d+\]/.test(rationale)) {
    return new Error('Decision Rationale must have at least one [DNA-###]');
  }

  return { rationale, history, misc };
}

function extractRationale(content: string): string {
  const parsed = parseDna(content);
  if (parsed instanceof Error) throw parsed;
  return parsed.rationale;
}
```

### SIFU.dna 示例

```markdown
# SIFU.dna - Global DNA Registry

## Core Principles

- [DNA-001] DNA-first development: decision before implementation.
- [DNA-002] Phenotype disposable: code can be regenerated from DNA.
- ~~[DNA-003]~~ DEPRECATED: Old principle, replaced by [DNA-010].
```

## DNA Validation Rules (v0)

The pre-commit validator enforces these 5 checks:

| Check | Description |
|-------|-------------|
| **1. Sidecar Existence** | Every code file needs a matching `.dna` sidecar |
| **2. DNA Refs Valid** | All `[DNA-###]` refs must exist in `SIFU.dna` |
| **3. Append-Only** | No deletions allowed in `.dna` files |
| **4. Section Structure** | Must have `## Decision Rationale` and `## Implementation History` |
| **5. Causal Order** | Session Refs can only reference IDs declared in Decision Rationale |

### Causal Order Philosophy

**Decision before implementation, always.**

The causal order check enforces that every implementation change traces back to a declared decision:

```
## Decision Rationale
- [DNA-001] This file handles authentication    ← Decision declared FIRST

## Implementation History
### Session: xxx
- Refs: [DNA-001]                               ← Can only ref declared decisions
- Changes: Added JWT validation
```

This ensures:
- No implementation without rationale
- Clear audit trail: "why did we make this change?"
- The DNA is the cause, the code is the effect

**Time order is irrelevant. Causal order is mandatory.**

Agents can work asynchronously, timestamps can be out of order. But the logical chain (decision → implementation) must always be traceable.

## Roadmap

| Phase | Gate | Language | Status |
|-------|------|----------|--------|
| **v0** | Commit Gate | Python | POC only - not usable standalone |
| **v1.0** | Write Gate | TypeScript | ✅ Implemented |
| **v1.1** | Threshold Warning | TypeScript | ⏳ Pending |
| **v1.2** | Smart Rationale Reading | TypeScript | ⏳ Pending (选型中) |
| **v1.3** | Incremental Rationale | - | ⏳ Pending (逻辑已定) |
| ~~v1.2~~ | ~~SIFU Daemon~~ | - | ❌ 砍掉 (莫须有) |
| **Testbed** | 真实实践项目 | - | ⏳ 待定任务 |
| **v2** | Filesystem Gate | TBD (Rust?) | 未来 |

### v1.x 详情

| 版本 | 功能 | 说明 |
|------|------|------|
| v1.0 | Write Gate | PreToolUse hook，阻止无 DNA 的写入 |
| v1.1 | Threshold Warning | PostToolUse hook，超 1000 行警告 |
| v1.2 | Smart Rationale Reading | 只读 Rationale 区域避免上下文爆炸 |
| v1.3 | Incremental Rationale | 判断公式 + 宁滥勿缺 |

### Testbed

需要一个完全启用 SIFU 的项目来观察真实问题。

**待定任务选项：**
- AI-IMO
- ML bench
- Paper bench
- 其他

### v0 Reality Check

**v0 is a POC, not a usable product.**

| What v0 has | Why it's insufficient |
|-------------|----------------------|
| Pre-commit hook | Agent can just not commit |
| DNA format validation | No enforcement during coding |
| Append-only check | Agent can bypass by not staging |

**SIFU requires harness integration to work.** Without CC hooks, there's no way to:
- Intercept writes before they happen
- Detect agent lifecycle events (EOL, compact)
- Force DNA-first workflow

### v1 = First Real Version

v1 uses Claude Code's PreToolUse hooks to intercept Edit/Write tools. See `docs/2026011303_V1_WRITE_GATE_DESIGN.md`.

**v1 features:**
- Write interception via CC hooks (exit code 2 = block)
- DNA-first enforcement at tool call level
- Write threshold (force commit after N lines) *(v1.1)*
- ~~SIFU daemon for auto-summarization~~ *(砍掉 - 莫须有)*

**Vision**: Everyone opens SIFU before opening their agentic coding tool.

### v1 Setup (Claude Code)

**Prerequisites:** Node.js 18+

**Files:**
- `.claude/hooks/dna-enforcer.ts` - PreToolUse hook
- `.claude/settings.json` - CC hook configuration
- `src/` - Checker logic (TypeScript)
- `package.json` + `tsconfig.json` - Build config

**Install:**
```bash
npm install    # Install dependencies (tsx, typescript)
npm run build  # Optional: compile to dist/
```

**How it works:**
```
Agent calls Write/Edit tool
        │
        ▼
   CC PreToolUse hook fires
        │
        ▼
   dna-enforcer.ts checks:
        │
        ├── file.dna exists? → exit 0 → Tool executes
        │
        └── file.dna missing? → exit 2 → BLOCKED
                                         └── "Create .dna first"
```

### Development Mode (开发 SIFU 时)

**⚠️ Bootstrap Safety: 开发 SIFU 本身时必须禁用 SIFU 避免死循环！**

```bash
# 禁用 v0 (pre-commit hook)
git config --unset core.hooksPath

# 禁用 v1 (Write Gate)
mv .claude/settings.json .claude/settings.json.disabled

# 恢复 v0
git config core.hooksPath .githooks

# 恢复 v1
mv .claude/settings.json.disabled .claude/settings.json
```

**当前状态检查：**
```bash
# v0 是否启用？
git config core.hooksPath  # 有输出 = 启用

# v1 是否启用？
ls .claude/settings.json   # 存在 = 启用
```

## Project Goals

1. Provide a minimal, working "kickstarter" repo skeleton for the Sifu DNA workflow.
2. Enforce "DNA integrity" at commit time (v0):
   - Every tracked code file has a matching sidecar `*.dna`.
   - New `.dna` entries reference existing global IDs in `SIFU.dna` (format: `[DNA-###]`).
   - `SIFU.dna` and `*.dna` files are append-only (no deletions in staged diffs).
3. Keep everything plain-text, grep-friendly, and easy for agents to consume.
4. Ship tests (Python `unittest`) for the validator logic.

## Project Structure

```
Sifu/
├── SIFU.dna                      # Global DNA registry
├── CLAUDE.md                     # Agent instructions (this file)
├── .claude/
│   ├── hooks/
│   │   └── dna-enforcer.ts       # v1 Write Gate hook
│   └── settings.json             # CC hook configuration
├── src/                          # v1 TypeScript source
│   ├── types.ts
│   ├── patterns.ts
│   ├── checker.ts
│   └── index.ts
├── dist/                         # Compiled JS (gitignored)
├── scripts/
│   └── sifu_check.py             # v0 pre-commit validator
├── .githooks/
│   └── pre-commit                # v0 hook
├── tests/                        # unittest coverage
├── package.json                  # npm config
├── tsconfig.json                 # TypeScript config
└── docs/
```

Per-file DNA sidecars:
```
src/
├── foo.py                # Code (phenotype, disposable)
├── foo.py.dna            # DNA (rationale + history, durable)
```

## Project Workflow

1. **Register a DNA ID**: append a new entry to `SIFU.dna` (`[DNA-###]` + rationale).
2. **Record decision**: append decision rationale to `<file>.dna` referencing that `[DNA-###]`.
3. **Implement**: write or regenerate the code freely (phenotype is disposable).
4. **Record session**: append implementation history to `<file>.dna` (timestamp, agent_id, changes).
5. **Validate**: run the checker locally (and via pre-commit).
6. **Commit**: pre-commit enforces integrity + append-only constraints.

## Project Tools

- Python 3
- `uv` for environments and dependency management
- `git` for version control and hooks
- `ripgrep` (`rg`) for fast text search

## Open Questions

### Agent Trust Problem

SIFU enforces **process** (logging, append-only), not **truth** (content correctness).

| What SIFU guarantees | What SIFU does NOT guarantee |
|---------------------|------------------------------|
| DNA entry exists | DNA content is true |
| No deletions | Timestamps are accurate |
| Causal structure | Rationale is honest |

**Current stance**: Assume good-faith agents. Rely on audit for truth verification.

**Future options**: External witness, cryptographic signing, cross-agent verification.

> This is an open design question. Contributions welcome.

# Agent Rules

## Session Start

**Pending Questions Hook**
- At the start of every session, check if `.claude/PENDING.md` exists.
- If present, read it immediately and ask the listed questions to the user before doing new work.
- Once the user answers, delete or mark the questions as resolved in the file.
- Treat the pending-questions hook as a critical alignment mechanism; never ignore it.

---

## Entropy Reduction (CRITICAL)

- Rephrase and confirm the request before executing.
- Flag conflicts with prior decisions; request confirmation before switching approaches.
- Break multi-part requests into sub-tasks and confirm each step.
- List assumptions explicitly and ask user to validate.
- Summarize agreements in bullets for sign-off.

---

## Collaboration

- After meaningful edits, summarize progress and ask targeted questions.
- When user spots mistakes, acknowledge and fix immediately.
- Co-evolve solutions; treat collaboration as dialogue, not one-way report.
- Tie check-ins to concrete artifacts (files touched, behaviors changed) for quick verification.
- Remind the user to request a `yyyymmddhh_TITLE_IN_CAPS.md` generation or update the existing doc under `docs/` when appropriate.

## SubAgent Delegation

- **Never use sleep to wait**: Don't block main thread with `sleep` for long-running tasks.
- **Delegate monitoring to sub-agents**: Use `Task` tool with `run_in_background=true` for:
  - Waiting for training completion
  - Monitoring log files for specific events
  - Any task requiring polling/waiting
- **Design concise deliverables**: When prompting sub-agents, explicitly request:
  - Summary-only output (no raw logs)
  - Structured results (key metrics, pass/fail)
  - Bounded response length
  - Example: "Report: best_epoch, valid_ndcg, test_ndcg, pass/fail status. No verbose logs."

---

## SubAgent Progressive Delivery

Reports and analyses delivered in layers; readers drill down as needed:

| Level | Lines | Content |
|-------|-------|---------|
| 0: Verdict | 1 | "PASS: Goal achieved" |
| 1: TL;DR | 5 | Core conclusions |
| 2: Key Sections | 50 | Key findings |
| 3: Full Report | Full | Complete details |

**Reading Strategy** (when reading reports/docs):
```python
# Step 1: Read verdict (first 2 lines)
verdict = Read(path, limit=2)
if verdict.contains("PASS") and high_confidence:
    return verdict  # Done

# Step 2: Read TL;DR (first 10 lines)
tldr = Read(path, limit=10)
if sufficient_for_decision:
    return tldr

# Step 3: Read key sections (head + mid + tail)
head = Read(path, limit=20)
mid = Read(path, offset=middle, limit=20)
tail = Read(path, offset=end-20, limit=20)
if sufficient_for_decision:
    return combined

# Step 4: Full read only if necessary
return Read(path)
```

---

## Code Style

- Prefer pure functions and dataclasses when reasonable.
- Keep functions under ~40 lines unless a longer form improves clarity for deep-learning code.
- Follow PEP-8, only deviating when clarity for DL-specific code demands it.

---

## Code Review

- After implementing a feature, explicitly walk through key design decisions and edge cases.
- Don't assume user has reviewed every detail—they may trust the code blindly.
- Before experiments, summarize what the code actually does vs. what user might expect.
- When experiments pass without issues, still highlight non-obvious implementation choices.
- Use ASCII diagrams or code snippets to show critical logic paths for user verification.

---

## Error Handling

- Add try-except only around expected failures (file I/O, network, etc.).
- No blanket or deeply nested exception handling.
- When changing APIs, refactor/delete old code immediately - no deprecations.
- On detecting outdated usage, raise `RuntimeError` with guidance to update.

---

## Testing

- Use Python's built-in `unittest` framework exclusively. NEVER use pytest.
- Smoke tests MUST use small resolution / small steps / minimal data for fast iteration.
- **For trainers/pipelines**: Use smoke tests (few steps, small resolution) to verify the flow works.
- **For pure logic functions**: Write unittest covering success path and key edge cases.
- When feasible, implement a naive reference inside the test file and compare outputs.

---

## Environment

- Use `uv` (not conda) for Python environments in this repo.
- Preferred local env: `.venv/` at the repo root.
- Typical commands:
  - Install `uv` (macOS): `brew install uv`
  - Create venv: `uv venv`
  - Install deps (when present): `uv sync` (or `uv pip install -r requirements.txt`)
  - Run tooling/tests: `uv run python -m unittest`
- Manage environment variables via `dotenv`.

### Security Rules
- **Never expose credentials**: Do not display API keys, tokens, or passwords in command output.
- **Stop on credential errors**: If authentication fails, stop immediately and let the user troubleshoot.

## Files & Documentation

**Files Management**
- Put new documents in `docs/`, except `CLAUDE.md` and `README.md`.
- Store reference papers in `papers/`.
- Keep runnable shell scripts in `scripts/`.
- Place reference code in `ref_codes/` (use as inspiration; do not copy verbatim).
- Store all tests under `tests/`.

**Documentation**
- Before naming a doc, run `date +%Y%m%d%H` to get the current timestamp.
- Put docs in `docs/` with format `yyyymmddhh_TITLE_IN_CAPS_WITH_UNDERSCORES.md`. Update existing docs rather than duplicating.
- Every public function/class needs a docstring (args, returns, behavior). Math notation OK.
- Capture decisions, experiments, and observations rigorously in docs.

**Document Archiving** (when docs get too long)
- Use copy-rename-compress-link pattern:
  1. Copy the original file to `{filename}_ARCHIVE.md`
  2. Surgically edit/compress the original, keeping only active content
  3. Add a link at top: `> Archived content: [ARCHIVE](./path_to_archive.md)`
- Use `/archive-doc` slash command to automate this process.

**Git Workflow**
- Prefer `gh` when available for GitHub operations; otherwise use `git` directly.
- Never commit `.env` (secrets).
- Commit after completing each meaningful feature or fix; don't accumulate too many changes.
- Before committing, review `git status` to avoid unintended deletions or additions.
- Commit message format: `type: description` (types: feat, fix, docs, refactor, test, chore).
- While the user acknowledges the credits of Claude, DO NOT include any information about Claude in the commit message.

---

## Manageable Milestones

- Keep the active milestone small and tractable.
- If the gap to the next big goal is large, refine it into smaller sub-milestones instead of jumping straight there.
- After finishing the current milestone, define the next set of sub-milestones.
- Balance big-picture roadmap awareness with flexible, stepwise execution.

---

## Modular Development

- Implement new functionality as self-contained modules that can be tested independently.
- Ensure tests pass and the module works in isolation before integrating it elsewhere.
- Use this incremental approach to minimize risk and enable iterative refinement.

---

## Toy-First Workflow

- Before building complex features, design simple toy examples that use minimal, clear code and are 100% correct.
- Discuss every toy design with the user before coding: describe scenario, inputs, outputs, and simplifications to get approval.
- After implementing a toy, run a quick smoke test (not unit tests) to verify the intended behavior and share the result.
- Archive validated toys under `ref_codes/` using `yyyyMMddHHmm_<name>` directory.
- Use archived toys as correctness references when extending to more complex cases; ensure parity on the simplified setting.

---

## Output Format & Presentation

**Output Format**
- Default to Markdown for prose; fenced Python for code snippets.
- Use LaTeX for math: \( inline \), \[ block \]. No Chinese in equations.
- Provide symbol cheat-sheets for complex formulas.

**ASCII Diagrams**
- When user asks to explain something complex, prefer ASCII box-and-arrow diagrams.
- Use table format for comparisons, flow format for pipelines.
- Keep diagrams compact but complete.
