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

SIFU adds a hidden `.dna.md` sidecar to every authored file. DNA records **what changed + why** in a 5-column table, newest-first. This keeps decision-making consistent across:

- **Session boundaries** — new session reads `.dna.md`, inherits prior decision logic
- **Context compaction** — compressed context loses reasoning, `.dna.md` preserves it on disk
- **Agent handoffs** — Agent B reads Agent A's rationale, continues the same trajectory
- **Multi-agent collaboration** — all agents share `.dna.md` as the single source of decision truth
- **Framework switches** — switch tools, switch models, DNA stays

Code is disposable. Decision rationale persists.

## Quick Start

```bash
cd your-project
npx @gongwu-ai/sifu init
```

Or tell your AI agent: "Install SIFU — run `npx @gongwu-ai/sifu init`"

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

SIFU is a layer, not a replacement. No conflicts with existing frameworks (Superpowers, Ralph, GSD, OpenSpec, etc.) — different skills, different concerns.

> Integration details: TBD — see [INTEGRATIONS.md](INTEGRATIONS.md)

## Supported Harnesses

| Harness | Status |
|---------|--------|
| **Claude Code** | Supported — SKILL + CLI |
| Cursor / Windsurf | TBD |
| Codex | TBD |
| Gemini CLI | TBD |
| OpenCode | TBD |
| Copilot | TBD |
| Cline / RooCode / Kiro | TBD |

Enforcement is via SKILL instructions (soft, no hooks). Harness adapter pattern ready — contributions welcome.

## CLI

```bash
sifu check              # List files missing .dna.md
sifu status             # DNA coverage %
sifu new <file>         # Create .dna.md template
sifu read <file>        # Top 10 entries (newest first)
sifu sync               # Update frontmatter caches
sifu hash <file>        # Generate hash8 ID
```

## Philosophy

| Principle | Meaning |
|-----------|---------|
| DNA-first | Decision rationale before implementation, always |
| Phenotype disposable | Code can be deleted and regenerated from DNA |
| Wrong is OK | Bad DNA can exist; append correction, never delete |
| Insert-only | New entries at TOP (newest-first). No delete, modify, or reorder. |
| 宁滥勿缺 | When in doubt, write the rationale |
