# SIFU

**DNA-first development for agentic coding.**

SIFU (師傅) enforces decision-before-implementation: every code change must have a rationale recorded in DNA files before it can be committed.

## Why SIFU?

When AI agents write code autonomously, we lose visibility into *why* decisions were made. SIFU fixes this by:

- **DNA files**: Every code file has a `.dna` sidecar recording decisions and history
- **Append-only**: DNA entries can never be deleted, only deprecated
- **Causal order**: Implementation must reference declared decisions
- **Pre-commit gate**: Commits are rejected if DNA integrity is violated

```
foo.py      ← Code (phenotype) - disposable, can be regenerated
foo.py.dna  ← DNA (genotype) - durable, records the "why"
```

## Quick Start

### Install in an existing project

```bash
# Clone SIFU
git clone https://github.com/w3nhao/Sifu-local.git /tmp/sifu

# Run init script
/tmp/sifu/scripts/sifu_init.sh

# Or manually:
cp /tmp/sifu/SIFU.dna .
cp /tmp/sifu/scripts/sifu_check.py scripts/
mkdir -p .githooks
cp /tmp/sifu/.githooks/pre-commit .githooks/
git config core.hooksPath .githooks
```

### One-liner init

```bash
curl -sSL https://raw.githubusercontent.com/w3nhao/Sifu-local/main/scripts/sifu_init.sh | bash
```

## Usage

### 1. Register a global decision

Add to `SIFU.dna`:
```
[DNA-006] Use PostgreSQL for persistent storage.
```

### 2. Create DNA for your code file

Before writing `src/database.py`, create `src/database.py.dna`:

```markdown
# database.py.dna

## Decision Rationale

- [DNA-006] This file handles PostgreSQL connections and queries.

## Implementation History

### Session: 2026-01-13T10:00:00 / agent-claude-xyz
- Refs: [DNA-006]
- Changes: Initial implementation of connection pool and query executor.
```

### 3. Write your code

Now you can create `src/database.py`. The pre-commit hook will verify:
- DNA sidecar exists
- DNA references valid IDs from SIFU.dna
- DNA has required sections
- Session refs only reference declared rationale IDs

### 4. Commit

```bash
git add src/database.py src/database.py.dna
git commit -m "feat: add database module"
# SIFU check passed.
```

## DNA Format

```markdown
# {filename}.dna

## Decision Rationale

- [DNA-001] Why this file exists
- [DNA-002] Key design decisions

## Implementation History

### Session: {ISO-timestamp} / {agent-id}
- Refs: [DNA-001], [DNA-002]
- Changes: What was done (10-50 words)
```

## Validation Rules

| Check | Description |
|-------|-------------|
| Sidecar exists | Every code file needs a `.dna` file |
| Valid refs | `[DNA-###]` must exist in `SIFU.dna` |
| Append-only | No deletions in DNA files |
| Section structure | Must have `## Decision Rationale` and `## Implementation History` |
| Causal order | Session Refs can only reference IDs declared in Rationale |

## File Structure

```
your-project/
├── SIFU.dna              # Global decision registry
├── scripts/
│   └── sifu_check.py     # Pre-commit validator
├── .githooks/
│   └── pre-commit        # Git hook
└── src/
    ├── foo.py            # Code (phenotype)
    └── foo.py.dna        # DNA (genotype)
```

## Excluded from DNA requirement

These files don't need `.dna` sidecars:
- `.dna` files themselves
- Markdown files (`*.md`)
- Config files (`*.json`, `*.yaml`, `*.toml`)
- Files in: `.git/`, `.venv/`, `.githooks/`, `scripts/`, `tests/`, `docs/`, `archive/`

## Philosophy

> **Document First — Code's Not Important.**

DNA is the genotype. Code is the phenotype. The phenotype can die, mutate, be resampled. The genotype persists.

See [CLAUDE.md](./CLAUDE.md) for the full manifesto.

## License

MIT
