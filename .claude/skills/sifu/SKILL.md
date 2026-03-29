---
name: sifu
description: "SIFU DNA-first framework. BINDING rules for all file write/create/update operations. Every authored file needs a hidden .dna.md sidecar with decision rationale BEFORE code changes. Triggers on Write, Edit, Create, Bash(sed/tee/cat/>), StrReplace, write_file, replace."
user-invocable: true
---

# SIFU — DNA-First Development Framework

> **BINDING**: All rules in this document are mandatory for every write operation.
> Applies to: Write, Edit, Create, StrReplace, write_file, replace, and any Bash command that creates or modifies files (sed, tee, cat >, echo >, cp, mv).

## Core Principle

**DNA before code. Always.**

Every authored file has a hidden `.dna.md` sidecar recording WHAT changed and WHY. Code is disposable phenotype; decision rationale is the genotype that persists.

## BINDING Rules

### Rule 1: DNA Before Write

Before modifying ANY non-exempt file, you MUST:
1. Ensure its `.dna.md` sidecar exists
2. Insert a new DNA entry at the TOP of the table (after header)
3. THEN make the code change

If the `.dna.md` does not exist, create it BEFORE writing the code file. **No exceptions.**

### Rule 2: Hidden Sidecar Naming

```
src/foo.js           <- code (phenotype)
src/.foo.js.dna.md   <- DNA (genotype, hidden)
```

Convention: `.{filename}.dna.md` (dot-prefix, next to the file).

### Rule 3: DNA File Structure

```markdown
---
file: src/foo.js
purpose: HTTP client wrapper — retry logic, timeout, auth header injection
last: c3d4e5f6 @ 202603291530+0800
entries: 3
---

| ID | Time | Agent | Act | Rationale |
|----|------|-------|-----|-----------|
| c3d4e5f6 | 202603291530+0800 | sonnet | add auth header | every request needs bearer token |
| b2c3d4e5 | 202603291415+0800 | opus | add backoff | fixed delay caused thundering herd |
| a1b2c3d4 | 202603291402+0800 | opus | initial creation | need centralized HTTP with retry |
```

**Newest first**: most recent entry is the first data row.

### Rule 4: 5-Column Table

| Column | Description |
|--------|-------------|
| **ID** | 8-char hex hash (see Rule 5) |
| **Time** | From `date +%Y%m%d%H%M%z`. Never fabricate. |
| **Agent** | Who: `opus`, `sonnet`, `haiku`, `human`, agent name |
| **Act** | What was done — imperative form |
| **Rationale** | Why it was done — the decision reasoning |

### Rule 5: DNA ID Generation

```
hash8 = sha256( filepath | timestamp | sha256(file_content_before_change) ).substring(0, 8)
```

- If file does not exist yet: use `sha256("")` as before_hash
- IDs are content-addressed. No global registry needed.
- For quick manual use: run `sifu hash <file>` to generate an ID

### Rule 6: Insert-Only (Newest First)

- New entries go at TOP after header separator (`|----|------|...`). Always.
- Never modify, delete, or reorder existing rows.
- Column alignment is NOT required. Pipes present, padding optional.
- **Deprecation**: insert new row at top with Act = `deprecated <old_id>`.

Edit tool pattern to insert:
```
old_string: |----|------|-------|-----|-----------|
new_string: |----|------|-------|-----|-----------|
| new_id | timestamp | agent | act | rationale |
```

### Rule 7: Frontmatter

| Field | Who maintains | Mutability |
|-------|--------------|------------|
| `file` | Agent at creation | Immutable |
| `purpose` | Agent | Semi-stable (update when role changes) |
| `last` | `sifu-cli sync` | Auto-updated cache |
| `entries` | `sifu-cli sync` | Auto-updated cache |

**Frontmatter IS mutable** (metadata). Table rows are insert-only (DNA).

### Rule 8: Exemptions

Defined in `.sifuignore` at project root (`.gitignore` syntax). If absent, hardcoded defaults apply.

Common exemptions: `.git/`, `.claude/`, `node_modules/`, `dist/`, `*.lock`, `*.png`, `*.pdf`, `.env`, `.gitignore`, `LICENSE`, `package-lock.json`.

**Everything NOT in `.sifuignore` needs DNA.**

## Workflow

1. `date +%Y%m%d%H%M%z` — get real timestamp
2. Compute before_hash: `sha256(file_content)` or `sha256("")` for new files
3. Generate ID: `sha256(filepath|timestamp|before_hash).substring(0,8)`
4. If `.dna.md` missing → create with frontmatter + header + first entry
5. If `.dna.md` exists → insert new row at TOP after header
6. NOW edit the code file

## Progressive Delivery (Reading DNA)

```
Level 0: frontmatter only → file purpose, freshness, activity
Level 1: top 3 rows       → recent decisions
Level 2: full table        → complete history
Level 3: DNA + code        → full picture
```

Or use CLI: `sifu read <file>` (top 10), `sifu read <file> -n 20`, `sifu read <file> --all`

## CLI Commands

```bash
sifu check            # List files missing .dna.md
sifu status           # DNA coverage stats
sifu new <file>       # Create .dna.md template with hash8 ID
sifu read <file>      # Top 10 entries (newest first)
sifu sync             # Update frontmatter caches
sifu hash <file>      # Generate DNA hash8 ID
```

## Full Specification

See `docs/2026032913_DNA_FORMAT_SPEC.md` in the project root for complete format details.
