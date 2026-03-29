---
name: sifu
description: "SIFU DNA-first guide. Format reference, workflow, exemptions, and CLI commands."
user-invocable: true
---

# SIFU — DNA-First Development Guide

## DNA Entry Format

One line per entry. Append at END of file only.

```
- [DNA-{NNN}] {timestamp} / {agent}: {what + why}
```

Example:
```
- [DNA-006] 202603291402+0800 / main: simplified DNA to one-line format, old two-section structure caused agent ordering mistakes
```

- `[DNA-{NNN}]` — globally unique ID, registered in `SIFU.dna.md`
- Timestamp — run `date +%Y%m%d%H%M%z` to get real time. Never fabricate.
- Every modification = brand new DNA ID. Never reuse an existing ID, even for the same file. Two edits to the same file = two different IDs.
- To deprecate: append new entry like `deprecated [DNA-003] because...`. Don't touch original.

## .dna.md File

Every authored file gets a `.dna.md` sidecar next to it:

```
sifu-init.js         ← code
sifu-init.js.dna.md  ← DNA (append-only)
```

Frontmatter:
```yaml
---
file: sifu-init.js
---
```

Then DNA entries, one per line, appended at END:
```
- [DNA-006] 202603291402+0800 / main: simplified DNA to one-line format, old two-section structure caused agent ordering mistakes
- [DNA-007] 202603291530+0800 / main: added multi-harness support, different harnesses use different tool names (Write|Edit vs StrReplace vs write_file|replace)
```

## SIFU.dna.md (Global Registry)

At project root. All DNA IDs registered here. Same format — one line per ID, append at END:

```markdown
- [DNA-006] simplified DNA to one-line format
- [DNA-007] added multi-harness support
- [DNA-008] inlined templates into sifu-init.js, removed templates/ directory
```

Register here FIRST, then reference in `.dna.md` files.

## Workflow

1. Run `date +%Y%m%d%H%M%z` — get real timestamp
2. Pick next DNA ID number (check SIFU.dna.md for latest)
3. Append `- [DNA-{NNN}] {description}` to END of `SIFU.dna.md`
4. Append `- [DNA-{NNN}] {timestamp} / {agent}: {what + why}` to END of `{file}.dna.md`
5. Now edit the code file

For new files: create `{file}.dna.md` with frontmatter + first entry BEFORE creating the code file.

## Append-Only Rules

- New entries go at END of file. Always.
- Never prepend (add before existing entries).
- Never insert in the middle.
- Never delete any entry.
- Never modify existing entries.
- When using Edit tool: match the LAST line of the file, put new content AFTER it.

## Exempt Files (no .dna.md needed)

Only auto-generated, binary, and tool-internal files are exempt:

**Directories:** `.git/`, `.claude/`, `.cursor/`, `.codex/`, `.opencode/`, `.github/`, `.venv/`, `__pycache__/`, `node_modules/`, `dist/`, `build/`

**Extensions:** `.lock`, `.pyc`, `.so`, `.dll`, `.png`, `.jpg`, `.gif`, `.svg`, `.pdf`, `.zip`, `.tar`, `.gz`, `.woff`, `.mp3`, `.mp4`, `.log`

**Filenames:** `SIFU.dna.md`, `.gitignore`, `.claudeignore`, `.env`, `__init__.py`, `LICENSE`

**Everything else needs DNA** — including `.py`, `.js`, `.ts`, `.go`, `.rs`, `.sh`, `.md`, `.json`, `.yaml`, `.toml`, `.txt`, `.cfg`, `.csv`, config files, documentation, scripts.

## CLI Commands

```bash
node sifu-cli.js init             # Initialize SIFU in current project
node sifu-cli.js check            # List files missing .dna.md
node sifu-cli.js status           # Show DNA coverage stats
node sifu-cli.js new <file>       # Generate .dna.md template for a file
```
