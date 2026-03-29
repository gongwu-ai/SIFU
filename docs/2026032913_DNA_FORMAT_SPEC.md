---
branch: main
commit: aef8d7a
---

# DNA Format Specification (v5)

> Canonical reference for `.dna.md` sidecar format, ID generation, and append-only rules.
> Linked from `CLAUDE.md`. All agents MUST follow this spec.

## 1. Sidecar Naming

Every authored file gets a **hidden** sidecar with `.dna.md` suffix:

```
src/
  foo.js            <- code (phenotype)
  .foo.js.dna.md    <- DNA (genotype, hidden)
```

Convention: `.{filename}.dna.md` (dot-prefix makes it hidden on Unix).

## 2. File Structure

A `.dna.md` file has two zones: **frontmatter** (mutable metadata) and **table** (append-only entries).

```markdown
---
file: src/foo.js
purpose: HTTP client wrapper — retry logic, timeout, auth header injection
last: a1b2c3d4 @ 202603291530+0800
entries: 3
---

| ID | Time | Agent | Act | Rationale |
|----|------|-------|-----|-----------|
| a1b2c3d4 | 202603291402+0800 | opus | initial creation | need centralized HTTP with retry |
| b2c3d4e5 | 202603291415+0800 | opus | add exponential backoff | fixed delay caused thundering herd |
| c3d4e5f6 | 202603291530+0800 | sonnet | add auth header injection | every request needs bearer token |
```

## 3. Frontmatter Fields

| Field | Mutability | Maintainer | Description |
|-------|-----------|------------|-------------|
| `file` | Immutable | Agent (at creation) | Relative path to the tracked file |
| `purpose` | Semi-stable | Agent | One-line description of what the file does and why it exists |
| `last` | Auto-updated | `sifu-cli sync` | Most recent entry ID + timestamp. Cache for Level 0 reads |
| `entries` | Auto-updated | `sifu-cli sync` | Count of DNA entries. Cache for Level 0 reads |

### Rules

- **Frontmatter IS mutable.** Agents may update `purpose` when a file's role changes. `last` and `entries` are maintained by `sifu-cli sync`.
- **`purpose` is mandatory.** Every `.dna.md` must have a `purpose` at creation time. This enables Level 0 progressive delivery (scan 100 files by frontmatter alone).
- **`last` and `entries` are caches, not source of truth.** The table rows are authoritative. Stale caches affect Level 0 precision, not correctness.

## 4. Table Format (5 Columns)

| Column | Description |
|--------|-------------|
| **ID** | `[DNA-<hash8>]` — globally unique, content-addressed (see Section 5) |
| **Time** | POSIX timestamp from `date +%Y%m%d%H%M%z`. Never fabricated. |
| **Agent** | Who made this change (e.g., `opus`, `sonnet`, `human`, agent name) |
| **Act** | What was done — action description in imperative form |
| **Rationale** | Why it was done — the decision reasoning |

### Table Rules

- The header row (`| ID | Time | ...`) and separator row (`|----|------|...`) appear once per file, immediately after frontmatter.
- Each new entry is one table row appended at the **END** of the file.
- **Column alignment is NOT required.** Pipes must be present; padding is optional. Never modify existing rows to re-align. **BINDING.**

## 5. DNA ID Generation (`[DNA-<hash8>]`)

IDs are content-addressed hashes, not sequential numbers.

### Algorithm

```
input  = file_path + "|" + timestamp + "|" + before_hash
hash   = sha256(input)
dna_id = hash.substring(0, 8)
```

| Component | Value |
|-----------|-------|
| `file_path` | Relative path to the tracked file (e.g., `src/foo.js`) |
| `timestamp` | POSIX timestamp string from `date +%Y%m%d%H%M%z` |
| `before_hash` | SHA-256 of the file's content **before** this change. If file does not exist yet: `sha256("")` = `e3b0c44298fc1c14...` (empty string hash) |

### Properties

- **Deterministic**: Same inputs always produce the same ID.
- **Collision-resistant**: 8 hex chars = 4 bytes = ~4 billion possibilities. Sufficient for per-project use.
- **No global registry needed**: IDs are self-validating. No SIFU.dna.md required.
- **Tamper-evident**: Changing the file path, timestamp, or pre-change content produces a different ID.

### CLI Generation

```bash
node sifu-cli.js new src/foo.js    # generates .src/foo.js.dna.md with hash8 ID
```

## 6. Append-Only Rules

These apply to the **table zone** (below frontmatter). **All are BINDING.**

| Rule | Description |
|------|-------------|
| Append at END | New rows go at the last line of the file. Always. |
| No prepend | Never add rows before existing entries. |
| No insert | Never insert rows in the middle. |
| No delete | Never remove any row. |
| No modify | Never change any existing row's content. |
| Deprecation | To retire a decision: append a NEW row with Act = `deprecated <ID>` and Rationale = why. |

### Edit Tool Pattern

When using the Edit tool to append:
```
old_string: (last table row)
new_string: (last table row)\n| new_id | new_time | agent | act | rationale |
```

## 7. Exempt Files (No `.dna.md` Needed)

Only auto-generated, binary, and tool-internal files are exempt.

**Directories** (skip entire subtree):
`.git/`, `.claude/`, `.cursor/`, `.codex/`, `.opencode/`, `.github/`, `.venv/`, `__pycache__/`, `node_modules/`, `dist/`, `build/`, `.next/`, `.nuxt/`, `.windsurf/`, `.agent/`

**Extensions:**
`.lock`, `.pyc`, `.pyo`, `.pyd`, `.so`, `.dll`, `.dylib`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`, `.webp`, `.pdf`, `.zip`, `.tar`, `.gz`, `.bz2`, `.woff`, `.woff2`, `.ttf`, `.eot`, `.mp3`, `.mp4`, `.wav`, `.avi`, `.log`

**Filenames** (exact match):
`.gitignore`, `.claudeignore`, `.env`, `.env.local`, `__init__.py`, `LICENSE`

**Everything else needs DNA** — including `.py`, `.js`, `.ts`, `.go`, `.rs`, `.sh`, `.md`, `.json`, `.yaml`, `.toml`, `.txt`, config files, documentation, scripts.

## 8. Progressive Delivery for Agents

Agents reading DNA should follow this strategy to minimize context consumption:

```
Level 0: Read frontmatter only (purpose + last + entries)
         -> Decide relevance. Skip irrelevant files.

Level 1: Read frontmatter + last 3 table rows (tail)
         -> Understand recent decisions.

Level 2: Read full table
         -> Complete decision history.

Level 3: Read DNA + code file
         -> Full picture for deep changes.
```

For bulk scanning (many files): Level 0 on all files, then Level 1+ only on relevant ones.

## 9. Workflow Summary

1. Run `date +%Y%m%d%H%M%z` — get real timestamp
2. Determine `before_hash` — hash of file content before change (or empty-string hash for new files)
3. Generate DNA ID: `sha256(filepath|timestamp|before_hash).substring(0,8)`
4. If `.dna.md` doesn't exist: create it with frontmatter + table header + first entry
5. If `.dna.md` exists: append new table row at END
6. Now edit the code file
7. Optionally run `sifu-cli sync` to update frontmatter caches
