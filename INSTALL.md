# SIFU Installation Guide

> This file is written for AI agents. If a user asks you to "install SIFU", follow these steps.

## Method 1: Run the install script (recommended)

```bash
cd /path/to/user-project
node /path/to/SIFU/sifu-init.js
```

Auto-detects harness and does everything. Accepts flags: `--claude`, `--cursor`, `--codex`, `--opencode`, `--copilot`, `--gemini`.

## Method 2: Manual setup

### Step 1: Create SIFU.dna.md

Create `SIFU.dna.md` at project root with this content:

```markdown
---
type: registry
---

# SIFU.dna.md — Global DNA Registry

> Append-only. New entries at END.

- [DNA-001] DNA-first: decision rationale before implementation, always
- [DNA-002] Phenotype disposable: code can be deleted and regenerated from DNA
- [DNA-003] Wrong is OK: bad DNA can exist, append correction, never delete
- [DNA-004] Append-only: new entries at END of file, no prepend, no insert, no delete, no edit
- [DNA-005] 宁滥勿缺: when in doubt, write the rationale
```

### Step 2: Copy hook + skill

| Harness | Hook to | Skill to |
|---------|---------|----------|
| Claude Code | `.claude/hooks/dna-enforcer.js` | `.claude/skills/sifu/SKILL.md` |
| Cursor/Windsurf | `.cursor/hooks/dna-enforcer.js` | `.cursor/skills/sifu/SKILL.md` |
| Codex | `.codex/hooks/dna-enforcer.js` | `.codex/skills/sifu/SKILL.md` |
| OpenCode | (no hooks) | `.opencode/skills/sifu/SKILL.md` |
| Copilot | (no hooks) | `.github/skills/sifu/SKILL.md` |

### Step 3: Register hook

Add to settings.json (MERGE, don't overwrite existing hooks):

| Harness | Event name | Matcher |
|---------|-----------|---------|
| Claude Code | `PreToolUse` | `Write\|Edit` |
| Cursor/Windsurf | `preToolUse` | `Write\|StrReplace` |
| Codex | `PreToolUse` | `Write\|Edit` |
| Gemini | `PreToolUse` | `write_file\|replace` |

### Step 4: Inject rules

Append the SIFU rules block to the rules file (the block starts with `<!-- SIFU:BEGIN -->` and ends with `<!-- SIFU:END -->`):

| Harness | Append to |
|---------|-----------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursor/rules/sifu.md` (new file) |
| Codex / OpenCode | `AGENTS.md` |
| Copilot | `copilot-instructions.md` |
| Gemini | `GEMINI.md` |

If file has `<!-- SIFU:BEGIN -->` already, replace that block.

## Verification

Ask the agent to create a code file. It should:
1. Register `[DNA-###]` in `SIFU.dna.md` (append at END)
2. Create `file.dna.md` with frontmatter + DNA entry
3. Then create the code file

If it skips 1-2, the hook blocks step 3.
