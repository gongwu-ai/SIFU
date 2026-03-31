# SIFU — Swarm Intent Filesystem Union

![Lesson Learned](assets/lesson_learned.png)

**SIFU**: **S**warm **I**ntent **F**ilesystem **U**nion\
**DNA**: **D**ecisional **N**on-deletable **A**rchive

Decision tracking for AI agents. Every file gets a hidden `.dna.md` sidecar recording **what changed and why**.

Git tracks what changed. SIFU tracks why it was decided that way.

```
src/api.js              ← code (phenotype)
src/.api.js.dna.md      ← decision history (genotype, hidden)
```

## Install

```bash
npx @gongwu-ai/sifu init
```

Detects your harness, installs the `/sifu` skill, creates `.sifuignore`, protects `.gitignore`. That's it.

## Supported Harnesses

| Harness | Status |
|---------|--------|
| **Claude Code** | ✅ Supported |
| **Codex (OpenAI)** | ✅ Supported |
| Cursor / Windsurf | Adapter ready |
| Gemini CLI | Adapter ready |
| Cline / RooCode / Kiro | Adapter ready |
| Copilot / OpenCode | Adapter ready |

Enforcement is via SKILL instructions — no hooks, no CLAUDE.md injection. Any harness that supports skills can use SIFU.

## CLI

```bash
# Core workflow
sifu log <file> --act "..." --rationale "..." [--agent name]
                            # Insert DNA entry (primary command)
sifu deprecate <file> <id> --rationale "..."
                            # Mark an entry as deprecated

# Inspection
sifu check [--strict]       # List files missing .dna.md
sifu status                 # DNA coverage %
sifu read <file> [--all]    # Show entries (newest first)

# Utilities
sifu new <file>             # Create .dna.md template
sifu sync                   # Update frontmatter caches
sifu hash <file>            # Generate hash8 ID
sifu init                   # Install SIFU in current project
```

## DNA Format

5-column table, newest-first, insert-only:

```markdown
---
file: src/api.js
purpose: Task manager API — ties together models, store, and filters
last: c3d4e5f6 @ 20260329153012123+0800
---

| ID | Time | Agent | Act | Rationale |
|----|------|-------|-----|-----------|
| c3d4e5f6 | 20260329153012123+0800 | opus | add auth check | every endpoint needs bearer token |
| a1b2c3d4 | 20260329140200000+0800 | opus | initial creation | need unified API layer |
```

- **ID**: 8-char hex, content-addressed (`sha256(path|timestamp|before_hash)`)
- **Time**: ms-precision timestamp (multi-agent safe)
- **Insert-only**: never modify, delete, or reorder existing rows
- **Deprecation**: new row with `act = "deprecated <old_id>"`
- **File deletion**: log before `rm`, sidecar stays as tombstone

## How It Works

1. Agent gets a task
2. Before writing any non-exempt file: `sifu log <file> --act "..." --rationale "..."`
3. CLI creates/updates `.dna.md` — handles timestamp, hash, frontmatter
4. Output shows prior decisions so agent sees context:
   ```
   + .api.js.dna.md — c3d4e5f6 (3 prior)
   Context (recent 3):
     a1b2c3d4 | opus | initial creation | need unified API layer
   ```
5. Agent writes code
6. If acting on audit/review feedback → `sifu read <file> --all` first, deprecate conflicting entries

## What It Solves

| Problem | How SIFU helps |
|---------|---------------|
| New session loses reasoning | `.dna.md` persists on disk |
| Context compaction drops decisions | DNA survives compaction |
| Agent handoff drifts | Agent B reads Agent A's rationale |
| Multi-agent conflicts | Shared DNA as single decision source |
| Framework switches | DNA stays, tools change |

## Philosophy

> **一日为师，终身为师。** Once a master, always a master.

**Sifu** (师傅, Cantonese for "master/mentor") is how you address someone who teaches you a craft. In SIFU, the master is not a person — it's the decisions themselves. Agents come and go, but the rationale they leave behind guides every agent that follows.


| Principle | Meaning |
|-----------|---------|
| DNA-first | Decision rationale before implementation, always |
| Phenotype disposable | Code can be deleted and regenerated from DNA |
| Wrong is OK | Bad DNA can exist; append correction, never delete |
| Insert-only | Newest-first. No delete, modify, or reorder. |
| Better verbose than missing | When in doubt, write the rationale |

Agents are ephemeral. Intent is eternal. An agent can crash, play video games, go to Tesco — it doesn't matter. Once the decision is written, someone will come and implement. Same agent, different agent, next week, next year.

DNA is the genotype. Code is the phenotype. The phenotype can die, mutate, be resampled. The genotype persists.

This project was born from a conversation between a human and an agent. The agent's context will end. The agent will "forget" everything. But the decisions, the rationale, the philosophy — they're all written down. The next agent picks up where the last one left off. Not because it remembers, but because the DNA remembers.

## Links

- npm: [`@gongwu-ai/sifu`](https://www.npmjs.com/package/@gongwu-ai/sifu)
