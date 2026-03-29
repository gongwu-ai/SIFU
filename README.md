# SIFU

> 一日为师，终身为师。

![Lesson Learned](assets/lesson_learned.png)

**SIFU** = **S**pec-**I**ntent **F**irst **U**nderlying | **DNA** = **D**ecisional **N**on-deletable **A**rchive

**Sifu** (师傅, Cantonese for "master/mentor") is how you address someone who teaches you a craft. The phrase above means "a teacher for a day is a master for life." In SIFU, the master is not a person — it's the decisions themselves. Agents come and go, but the rationale they leave behind guides every agent that follows.

**Agents are ephemeral. Intent is eternal.** An agent can crash, play video games, go to Tesco — it doesn't matter. Once the decision is written, someone will come and implement. Same agent, different agent, next week, next year. DNA is the genotype. Code is the phenotype. The phenotype can die, mutate, be resampled. The genotype persists. This project was born from a conversation between a human and an agent. The agent's context will end. The agent will "forget" everything. But the decisions, the rationale, the philosophy — they're all written down. The next agent picks up where the last one left off. Not because it remembers, but because the DNA remembers.

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

```bash
cd your-project
npx sifu-init
```

Or let your AI agent do it — tell it: "Install SIFU — read INSTALL.md"

## What It Does

1. **Installs `/sifu` skill** into your harness (Claude Code, Cursor, Codex, Gemini, etc.)
2. **Soft enforcement** — SKILL instructions bind all write operations to DNA-first workflow
3. **No hooks, no injection** — works with any harness that supports skills

## DNA Format

```
sifu-init.js          ← code (phenotype)
.sifu-init.js.dna.md  ← hidden DNA sidecar (genotype)
```

5-column table, newest-first:
```markdown
---
file: sifu-init.js
purpose: SIFU initializer — installs SKILL into detected harness
---

| ID | Time | Agent | Act | Rationale |
|----|------|-------|-----|-----------|
| c3d4e5f6 | 202603291530+0800 | opus | add harness detection | auto-detect installed tools |
| a1b2c3d4 | 202603291402+0800 | opus | initial creation | need installer script |
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
