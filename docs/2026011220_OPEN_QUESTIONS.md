# Sifu DNA System - Analysis & Open Questions

## Context

This document captures the analysis and open questions from discussing the Sifu DNA-first development system. It serves as a checkpoint before implementation decisions.

---

## What the System Claims

From `chat_log.dna` (a conversation about Agentic Coding):

1. **DNA = Intent/Rationale** (the "why") - durable, append-only
2. **Code = Phenotype** (the "what") - disposable, regenerable
3. **Trade disk space for traceability** - keep everything, never delete
4. **Override mechanism**: Can't delete old DNA, but CAN mark as `DEPRECATED` and add new DNA that supersedes it (line 328, 446 of chat_log.dna)

---

## Why Not Just Git?

Git already tracks history of all files including `.dna` files. So why append-only?

| Approach | Where history lives | To see old decisions |
|----------|--------------------|-----------------------|
| **Git only** | Spread across commits | `git log -p file.dna` |
| **Append-only DNA** | All in current file | Just read the file |

**Arguments for append-only:**
- All decisions in one place, no digging through git
- Agent-friendly: AI reads current file, no git traversal needed
- Git commits touch many files - no fine-grained per-file history
- Visible accountability: deprecated decisions stay visible

**Arguments against:**
- Redundant with git
- File bloat over time
- Extra enforcement complexity

**Decision**: Trade disk space for plain-text readability. Git is the backup, DNA file is the readable record.

---

## Open Operational Questions

### Q1: Triggering - When does DNA update?

Current design: Tied to `git commit` via pre-commit hook.

**Problems:**
- Newbies don't commit frequently - DNA stays stale
- If auto-triggered, what's the frequency?
- What event should cause a DNA checkpoint?

**Possible triggers:**
- Manual (current): User commits
- Time-based: Every N minutes of coding
- Event-based: On file save, test run, etc.
- Agent-driven: AI decides when to checkpoint

**Unresolved**: What is the "clock" of DNA evolution?

---

### Q2: Compression - How to prevent bloat?

Append-only means files grow forever.

```
Day 1:    [DNA-001] Initial design
Day 30:   [DNA-001]...[DNA-050] (50 entries)
Day 365:  [DNA-001]...[DNA-500] (500 entries - unreadable)
```

**Biological DNA has:**
- Selection pressure (bad mutations die)
- Generations (old organisms die)

**This system has no death mechanism.**

**Possible compression models:**
1. **Summarization**: Periodically compress old entries into summary
2. **Generations**: Archive old DNA, start fresh generation
3. **Hierarchy**: SIFU.md (high-level) -> module.dna (mid) -> file.dna (detail)
4. **Relevance decay**: Old entries auto-collapse, expand on demand

**Unresolved**: What's the compression/archival model?

---

### Q3: Consistency - How to sync global and local?

```
SIFU.md (global)              file.py.dna (local)
----------------              ------------------
[DNA-001] Use Redis       ->  References [DNA-001]
[DNA-002] DEPRECATED          Still references [DNA-001] <- STALE
          Use in-memory
```

**Questions:**
- When global DNA changes, do locals auto-update?
- Can local "mutate" (disagree with global)?
- Who/what resolves conflicts?
- Is there a propagation mechanism?

**Unresolved**: What's the consistency model between SIFU.md and *.dna files?

---

### Q4: What if DNA itself is wrong?

The system assumes humans write good intent. But:
- Humans write garbage rationales too
- Append-only preserves garbage forever (only DEPRECATED, not deleted)

**Mitigation (from chat_log.dna line 328):**
> "Agent must respect rationale UNLESS it can provide MORE SUFFICIENT rationale to override"

So: Override is allowed if you have better reasoning. Not blind accumulation.

**Partially resolved**: Override mechanism exists, but who judges "more sufficient"?

---

## Naming Decision

User preference: `SIFU.md` instead of `SIFU_DNA.md`
- Simpler
- DNA concept is in content, not filename
- "Sifu" (master) is the project identity

---

## Minimal Kickstarter Scope

Given the open questions, what can we actually build now?

**Can enforce (mechanical):**
- Every code file needs a `.dna` sidecar
- `.dna` entries must reference `[DNA-xxx]` from `SIFU.md`
- No line deletions in `SIFU.md` or `.dna` files

**Cannot solve yet (needs design):**
- Trigger frequency
- Compression model
- Global-local consistency
- Conflict resolution

---

## Next Steps

Pending user decision on:
1. Whether to proceed with minimal kickstarter (enforce basic rules only)
2. Or design answers to operational questions first
3. Or simplify further (e.g., SIFU.md only, no per-file .dna sidecars)
