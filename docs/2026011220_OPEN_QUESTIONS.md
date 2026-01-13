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

## Target Audience (Clarified)

**This is NOT for human coding.** Git already works great there.

**This IS for:**
- **Agentic systems** (no human, auto-run for long periods)
- **Agentic orchestration systems** (human may exist, directing agents)

DNA-first is a **git enhancement layer for agents**, not a replacement for human git workflow.

---

## Naming & Hierarchy (Clarified)

### SIFU.dna (not SIFU.md)

`SIFU.dna` = meta DNA that governs **only** global rule documents.

```
SIFU.dna                          ← Meta DNA (rules ONLY global rule docs)
├── CLAUDE.md                     ← Governed by SIFU.dna
├── AGENTS.md                     ← Governed by SIFU.dna
└── [other *.md rule docs]        ← Governed by SIFU.dna

src/
├── foo.py
├── foo.py.dna                    ← Independent (NOT under SIFU.dna)
├── bar.py
└── bar.py.dna                    ← Independent (NOT under SIFU.dna)
```

**Two separate domains:**
1. **SIFU.dna** → governs global rule docs only
2. **\*.dna sidecars** → govern their own code files, independently

No hierarchy between SIFU.dna and code-level DNA files.

---

## SIFU Supervision Model

### 一日为师，终身为师 (Once a master, always a master)

**Inside SIFU supervision:**
- ALL edits go through SIFU
- No bypassing DNA logging
- Everything tracked, no exceptions

**The lock is at SIFU level, not harness level:**

```
┌─────────────────────────────────────────┐
│              SIFU (master)              │
│                                         │
│   ┌─────────┐  ┌─────────┐  ┌───────┐   │
│   │ Claude  │  │ Cursor  │  │ Other │   │
│   │  Code   │  │         │  │ Agent │   │
│   └────┬────┘  └────┬────┘  └───┬───┘   │
│        │            │           │       │
│        └────────────┼───────────┘       │
│                     ▼                   │
│              Codebase                   │
│        (all can touch under SIFU)       │
└─────────────────────────────────────────┘

✓ OK: Switch harness under same SIFU
✗ NOT OK: Different SIFU tries to intervene
```

**Harness = just an agent.** Interchangeable under same SIFU.

**SIFU = the master.** Only one SIFU per codebase. Another SIFU cannot take over.

### Clean Dump (Escape Hatch)

Codebase can be exported without DNA:

```
SIFU-supervised repo          Fork (clean dump)
──────────────────────        ─────────────────
SIFU.dna                  →   (gone)
CLAUDE.md                 →   (gone or kept as plain doc)
foo.py.dna                →   (gone)
foo.py                    →   foo.py (code only)
```

New system can:
- Use code freely
- Start fresh DNA with their own harness
- 烙印 (brand) their own signatures
- Maintain their own integrity

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

### Q1: Triggering - When is DNA updated?

#### Old framing (human-centric, wrong)

~~Current design: tied to `git commit` via a pre-commit hook.~~

~~Problem: humans don't commit frequently, so DNA stays stale.~~

This framing is wrong because **humans aren't the ones coding—agents are.**

#### New framing (agent-centric)

**Trigger = agent lifecycle events:**
- **EOL (end-of-life)**: session exit, crash, timeout, or handoff back to a human
- **Context compaction**: agent is about to "forget" (context window is full)

**Who writes the DNA?**
- A SIFU daemon (a medium-cost model/agent)
- Like auto-compaction: summarizes meaningful decisions before the agent dies/forgets

#### The gap problem

```
Timeline:
─────────────────────────────────────────────────────►
   │                                              │
   ▼                                              ▼
Session start                            EOL/Compaction
   │                                              │
	   │  ← Agent acting, making changes →            │
	   │     (DNA not yet updated)                    │
   │                                              │
   └──────────── GAP: untracked ─────────────────►│
                                                  │
                                            DNA updated
```

Session work is not summarized into DNA until EOL/compaction.

#### The orphan code problem? (Resolved: No Such Problem)

**Initial concern**: an agent crashes → code exists without DNA lineage.

**But wait**: DNA (decision) comes before implementation (impl). Always.

```
Decision (DNA)  →  Impl attempt  →  Audit  →  Final record
      ↓                ↓              ↓            ↓
   Written         In progress     Pass/fail   DNA updated
    FIRST          (risky)                    with status
```

**Crash scenarios:**

| Crash point | What survives | What's lost | Recovery |
|-------------|---------------|-------------|----------|
| After decision, before impl | DNA | Nothing yet | Next agent implements |
| During impl | DNA | Partial code | Next agent re-implements |
| After impl, before audit | DNA + code | Audit status | Next agent audits |
| After audit | DNA + code + status | Nothing | Complete |

**Conclusion**:
- We can end up with "DNA without phenotype" (decision made, impl lost), not "phenotype without DNA".
- **The risk is losing implementation work, not losing lineage.**
- Since code is regenerable from DNA (phenotype from genotype), that loss is acceptable.
- No orphan-code problem exists (DNA always comes first).

The only real edge case is bypassing SIFU and editing code directly; that violates 一日为师 anyway.

#### The core insight

Once the decision (DNA) is written, the agent's fate is irrelevant:

```
DNA (decision) written
         │
         ▼
   ┌─────────────────────────────────────┐
   │  Agent can:                         │
   │  - Crash                            │
   │  - Play video games                 │
   │  - Go to Tesco                      │
   │  - Whatever                         │
   │                                     │
   │  Doesn't matter.                    │
   └─────────────────────────────────────┘
         │
         ▼
   Someone will come and implement.
   (same agent, different agent, next week, next year)
```

**DNA is durable. The agent is ephemeral. Implementation will happen eventually.**

This is "phenotype disposable, genotype durable" in action.

#### Simplification thought

Maybe DNA doesn't need to track **every** change. It tracks **decisions**.

```
Agent session:
- Edit 1: fix typo          ← not worth DNA
- Edit 2: fix typo          ← not worth DNA
- Edit 3: refactor auth     ← DECISION, worth DNA
- Edit 4: fix typo          ← not worth DNA
```

At EOL/compaction, the SIFU daemon summarizes meaningful decisions and ignores noise.

**Status**: Resolved.
- Trigger = agent EOL / context compaction
- Writer = SIFU daemon (medium-cost model)
- Orphan code = impossible (DNA comes first)
- Risk = losing implementation work, not lineage (acceptable; code is regenerable from DNA)

---

### Q2: Compression - How to prevent bloat?

#### Initial Concern

Append-only means files grow forever.

```
Day 1:    [DNA-001] Initial design
Day 30:   [DNA-001]...[DNA-050] (50 entries)
Day 365:  [DNA-001]...[DNA-500] (500 entries - unreadable?)
```

#### Key Insight: DNA is Already Compressed

DNA entries are **LLM-compressed summaries**, not verbose logs.

Each decision = 10-50 words, descriptive, not every code change logged.

**Revised bloat calculation:**

```
Day 1:     1 entry × 50 words = 50 words
Day 30:    50 entries × 50 words = 2,500 words (~10KB)
Day 365:   500 entries × 50 words = 25,000 words (~100KB)
Year 5:    5,000 entries × 50 words = 250,000 words (~1MB)
```

**1MB after 5 years of decisions.** That's nothing.

#### Is Bloat Even a Problem?

| Concern | Reality |
|---------|---------|
| File too big to read | 1MB is trivial for agents |
| Too many entries to scan | Agents handle long context fine |
| Human readability | Humans rarely read raw DNA anyway |

#### Possible Future Compression (If Needed)

If bloat ever becomes a problem:
1. **Summarization**: Periodically compress old entries into summary
2. **Generations**: Archive old DNA, start fresh generation
3. **Hierarchy**: SIFU.dna (high-level) → module.dna (mid) → file.dna (detail)
4. **Relevance decay**: Old entries auto-collapse, expand on demand

But these are premature optimizations for now.

**Status**: Resolved. DNA entries are already LLM-compressed (10-50 words). Bloat is a non-problem.

---

### Q3: Consistency - How to sync global and local?

#### Initial Concern

```
SIFU.dna (global)             file.py.dna (local)
─────────────────             ──────────────────
[DNA-001] Use Redis       →   References [DNA-001]
[DNA-002] DEPRECATED          Still references [DNA-001] ← STALE?
          Use in-memory
```

**Questions:**
- When global DNA changes, do locals auto-update?
- Can local "mutate" (disagree with global)?
- Who/what resolves conflicts?
- Is there a propagation mechanism?

#### Key Insight: No Sync Problem Exists

**The model:**

1. **SIFU.dna** = blueprint + decision log
   - Decision logged first (e.g., "update CLAUDE.md with bird's eye view")
   - Actual content depends on agent's sampling/implementation

2. **Local can read global** - local .dna files can reference SIFU.dna decisions

3. **Local can VIOLATE global** - as long as violation is logged to its own .dna
   - Local mutation is allowed if recorded
   - No strict enforcement, just logging

4. **Agents forget rules sometimes** - we don't care because:
   - Decision is always logged
   - If agent forgets and does something different, that new decision gets logged too
   - History preserved either way

#### Consistency Model = Eventual Consistency Through Logging

```
SIFU.dna says: "Use Redis"
         │
         ▼
Local agent reads... or forgets... or disagrees
         │
         ▼
Local does something different? Fine.
         │
         ▼
As long as local.dna logs: "Decided to use Postgres instead because X"
```

**No auto-sync. No conflict resolution. Just log everything.**

The DNA log is the source of truth, not the current state.

**Status**: Resolved.
- No sync mechanism needed
- Local can diverge from global
- Only requirement: divergence must be logged to local .dna

---

### Q4: What if DNA itself is wrong?

#### Initial Concern

The system assumes humans write good intent. But:
- Humans write garbage rationales too
- Append-only preserves garbage forever (only DEPRECATED, not deleted)

**From chat_log.dna line 328:**
> "Agent must respect rationale UNLESS it can provide MORE SUFFICIENT rationale to override"

#### Key Insight: Wrong is Okay

| Principle | Explanation |
|-----------|-------------|
| Wrong is okay | DNA can be wrong, that's fine |
| No deletion | Can't delete DNA entries, ever |
| Always incremental | Modifications are additive only |
| Deprecate + new | Mark old as DEPRECATED, add new decision |

```
[DNA-001] Use Redis for caching
          ... time passes, turns out it was wrong ...
[DNA-002] DEPRECATED [DNA-001]: Redis doesn't scale for our use case
          New decision: Use in-memory LRU cache instead
```

#### No Judge Needed

The question "who judges more sufficient?" dissolves:
- Anyone can deprecate and add new DNA
- The log shows evolution of thinking
- No central authority needed
- Just log everything, let history show the reasoning

**Status**: Resolved.
- Wrong DNA is allowed (stays in history)
- No deletion, only DEPRECATED + new
- No central authority judging "more sufficient"
- The log itself is the judge (transparent reasoning history)

---

## Summary Table

| Question | Status | Key Insight |
|----------|--------|-------------|
| Q1: Trigger | **Resolved** | EOL/compact; DNA first, no orphan code; losing impl is OK |
| Q2: Compression | **Resolved** | Already LLM-compressed (10-50 words); 1MB after 5 years is nothing |
| Q3: Consistency | **Resolved** | No sync needed; local can violate global if logged; eventual consistency |
| Q4: Wrong DNA | **Resolved** | Wrong is OK; no deletion; DEPRECATED + new; log is the judge |

---

## Next Steps

All questions resolved (Q1-Q4). Ready for implementation.
