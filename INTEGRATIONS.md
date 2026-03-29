# SIFU Integrations

> **Status: TBD** — Integration testing with other frameworks is planned but not yet validated.

SIFU is a layer, not a replacement. It adds DNA (decision rationale) via SKILL instructions. No hooks, no injection — so conflicts are unlikely with any framework.

## Planned Integrations

| Framework | SIFU adds | Status |
|-----------|-----------|--------|
| [Superpowers](https://github.com/obra/superpowers) | Decision rationale alongside TDD/debugging | TBD |
| [Ralph](https://github.com/snarktank/ralph) | Cross-iteration memory for autonomous loops | TBD |
| [GSD](https://github.com/gsd-build/get-shit-done) | Per-file decision history for planning waves | TBD |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Implementation rationale alongside spec management | TBD |

## Why Conflicts Are Unlikely

- SIFU uses **SKILL-based soft enforcement** (no PreToolUse hooks)
- SIFU adds `/sifu` skill (different name from other frameworks' skills)
- SIFU does not modify CLAUDE.md, AGENTS.md, or any rules file
- `.dna.md` sidecars are hidden files that don't interfere with other tools
