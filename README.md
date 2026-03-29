# SIFU

> 一日为师，终身为师。

**Sifu** (师傅, Cantonese for "master/mentor") is how you address someone who teaches you a craft. The phrase above means "a teacher for a day is a master for life." In SIFU, the master is not a person — it's the decisions themselves. Agents come and go, but the rationale they leave behind guides every agent that follows.

## The Problem

AI coding agents don't just forget. They **drift**. New sessions, compacted contexts, agent handoffs all cause decision logic to silently change. The code looks fine. The decisions are inconsistent.

Git tracks **what** changed. Nobody tracks **why** it was decided that way.

## The Solution

SIFU adds a `.dna.md` sidecar to every authored file. DNA is append-only and records **what changed + why** in one line per entry. This keeps decision-making consistent across:

- **Session boundaries** — new session reads `.dna.md`, inherits prior decision logic
- **Context compaction** — compressed context loses reasoning, `.dna.md` preserves it on disk
- **Agent handoffs** — Agent B reads Agent A's rationale, continues the same trajectory
- **Multi-agent collaboration** — all agents share `.dna.md` as the single source of decision truth
- **Framework switches** — switch tools, switch models, DNA stays

Code is disposable. Decision rationale persists.

## Quick Start

**Option A: One command**
```bash
git clone https://github.com/AI4Science-WestlakeU/SIFU.git
cd your-project
node /path/to/SIFU/sifu-init.js
```

**Option B: Let your AI agent do it**
```bash
git clone https://github.com/AI4Science-WestlakeU/SIFU.git
# Tell your agent: "Install SIFU from /path/to/SIFU — read INSTALL.md"
```

## What It Does

1. **Creates `SIFU.dna.md`** — global decision registry
2. **Injects rules** into your rules file (CLAUDE.md / AGENTS.md / etc.)
3. **Installs hook** — blocks file writes without valid `.dna.md` sidecar
4. **Adds `/sifu` skill** — format reference and CLI commands

## DNA Format

```
sifu-init.js         ← code
sifu-init.js.dna.md  ← DNA sidecar
```

Frontmatter:
```yaml
---
file: sifu-init.js
---
```

Entries (one line each, append at END):
```
- [DNA-006] 202603291402+0800 / main: simplified DNA to one-line format, old two-section structure caused agent ordering mistakes
- [DNA-007] 202603291530+0800 / main: added multi-harness support, different harnesses use different tool names
```

## Works With Everything

SIFU is a layer, not a replacement. No conflicts.

| Framework | SIFU adds | They keep doing |
|-----------|-----------|-----------------|
| [Superpowers](https://github.com/obra/superpowers) | Decision rationale | TDD, debugging, code review |
| [Ralph](https://github.com/snarktank/ralph) | Cross-iteration memory | Autonomous loop execution |
| [GSD](https://github.com/gsd-build/get-shit-done) | Per-file decision history | Planning, waves, verification |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Implementation rationale | Spec management |
| Standalone | All of the above | — |

See [INTEGRATIONS.md](INTEGRATIONS.md) for details.

## Supported Harnesses

| Harness | Hook support | Tool matcher |
|---------|-------------|-------------|
| Claude Code | Yes | `Write\|Edit` |
| Cursor / Windsurf | Yes | `Write\|StrReplace` |
| Codex | Yes | `Write\|Edit` |
| Gemini CLI | Yes | `write_file\|replace` |
| OpenCode | Plugin | `write\|edit` |
| Copilot | Rules only | — |

## CLI

```bash
node sifu-cli.js check     # List files missing .dna.md
node sifu-cli.js status    # Show DNA coverage %
node sifu-cli.js new <f>   # Generate .dna.md template
```

## Philosophy

| Principle | Meaning |
|-----------|---------|
| DNA-first | Decision rationale before implementation, always |
| Phenotype disposable | Code can be deleted and regenerated from DNA |
| Wrong is OK | Bad DNA can exist; append correction, never delete |
| Append-only | New entries at END of file. No prepend, insert, delete, or edit. Ever. |
| 宁滥勿缺 | When in doubt, write the rationale |
