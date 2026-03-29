# SIFU Integrations

SIFU is a layer, not a replacement. It adds DNA (decision rationale) to any existing setup. Install SIFU on top of your current framework — they don't conflict.

```bash
# Already using superpowers/ralph/GSD/OpenSpec? Just run:
cd your-project
node /path/to/SIFU/sifu-init.js
# Done. SIFU merges into your existing settings.json without touching other hooks.
```

## Why There's No Conflict

| What SIFU touches | What others touch | Conflict? |
|-------------------|-------------------|-----------|
| CLAUDE.md (appends at end) | Superpowers: SessionStart hook injection | No |
| | Ralph: has own CLAUDE.md (SIFU appends) | No |
| | GSD: doesn't modify CLAUDE.md | No |
| PreToolUse hook (Write/Edit) | Superpowers: SessionStart hook | No (different event) |
| | Ralph: no hooks | No |
| | GSD: PostToolUse hook | No (different event) |
| `/sifu` skill | All: have their own skills | No (different names) |

## With Superpowers

Superpowers manages discipline (TDD, debugging, code review). SIFU manages decision rationale.

```
Superpowers: "Write failing test first." (HOW to code)
SIFU:        "Write .dna.md before test file." (WHY this test exists)

Superpowers: "Dispatch implementer subagent."
SIFU:        "Subagent reads .dna.md with code, writes .dna.md before code."
```

## With Ralph Loop

Ralph manages autonomous execution loops. SIFU provides cross-iteration memory.

```
Ralph iteration 1: Agent implements feature, writes .dna.md alongside code.
Ralph iteration 2: New agent (fresh context) reads .dna.md → knows WHY previous code exists.
```

Ralph's agents lose context every iteration. SIFU's `.dna.md` files are the memory that persists.

## With GSD (Get-Shit-Done)

GSD manages planning, wave execution, and verification. SIFU records per-file decisions.

```
GSD planner: Creates PLAN.md (exempt from DNA — it's in a tool directory)
GSD executor: Implements code → SIFU hook fires → must write .dna.md first
GSD verifier: Checks implementation → can also check .dna.md completeness
```

## With OpenSpec

OpenSpec manages specs and delta changes. SIFU records implementation rationale.

```
OpenSpec: Defines WHAT to build (specs/changes/)
SIFU:    Records WHY each file was built this way (.dna.md sidecars)
```

OpenSpec's `openspec/` directory is in a tool directory — exempt from DNA.

## With Any Other Framework

If your framework:
- Uses `SessionStart` hooks → no conflict (SIFU uses `PreToolUse`)
- Uses `PostToolUse` hooks → no conflict (SIFU uses `PreToolUse`)
- Has its own skills → no conflict (SIFU adds `/sifu`, different name)
- Has its own CLAUDE.md content → no conflict (SIFU appends with `<!-- SIFU:BEGIN/END -->` markers)
