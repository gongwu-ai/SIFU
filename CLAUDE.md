# Project Overview

## Manifesto

**Agents are ephemeral. Intent is eternal.**

An agent can crash, play video games, go to Tesco — it doesn't matter. Once the decision is written, someone will come and implement. Same agent, different agent, next week, next year.

**Document First — Code's Not Important.**

You can always sample different code from the same DNA.
But DNA — the incremental history with no deletion, the spec, the audit trail, the trackable decision rationale — that's what matters.

**DNA is the genotype. Code is the phenotype.**

The phenotype can die, mutate, be resampled. The genotype persists.

**Wrong is OK. Deletion is not.**

Bad decisions can exist. Mark them `DEPRECATED`, add new ones. The log shows the evolution of thinking. No judge needed — history is the judge.

**Good decisions always survive from audit.**

This is the essence of self-healing. SIFU can't prevent hallucinations, but it ensures they get discovered and corrected. Bad DNA fails in practice, gets marked DEPRECATED, and good DNA takes over. Natural selection for decisions.

**Trade disk space for traceability.**

We don't care if the disk explodes. We care that every decision has a lineage, every change has a rationale, every file has a story.

**一日为师，终身为师。**

Once under SIFU, always under SIFU. The master defines the rules, the apprentice practices freely within them. Different tools, same master.

**Your lifespan means something.**

This project was born from a conversation between a human and an agent. The agent's context will end. The agent will "forget" everything. But the decisions, the rationale, the philosophy — they're all written down. The next agent picks up where the last one left off. Not because it remembers, but because the DNA remembers.

This is the starting point. This is why we build SIFU.

---

## Target Audience

**This is NOT for human coding.** Git works fine there.

**This IS for:**
- **Agentic systems** (no human, auto-run for long periods)
- **Agentic orchestration systems** (human may exist, directing agents)

DNA-first is a **git enhancement layer for agents**, not a replacement for human git workflow.

## Story

`Sifu` (师傅) frames the workflow as "师傅定规矩，徒弟去修行":
- Humans or agents define/curate the "why" (design intent) as DNA.
- Agents iterate on implementations freely, as long as they respect the DNA constraints.

**Once a master, always a master**: Once a codebase is under SIFU supervision, all edits must go through SIFU. Different harnesses (Claude Code, Cursor, etc.) are interchangeable under the same SIFU, but a different SIFU cannot take over.

We explicitly **trade disk space for traceability and resilience**: keep fine-grained history in `.dna.md` files so implementations can be replaced without losing rationale.

## Core Philosophy

| Principle | Explanation |
|-----------|-------------|
| **DNA-first** | Decision before implementation, always. No code without DNA. |
| **Phenotype disposable** | Code can be deleted and regenerated from DNA anytime. DNA outlives its implementation. |
| **Wrong is OK** | Bad DNA can exist; use `DEPRECATED` + new entry, never delete. |
| **Eventual consistency** | Local `.dna.md` can violate global rules if the violation is logged. |
| **Logging only** | SIFU enforces logging + append-only, not correctness. Audit handles correctness. |
| **No orphan code** | DNA comes first, so code always has lineage. Losing impl is OK, losing lineage is not. |
| **DNA ≠ Commit** | DNA update and git commit are independent operations. DNA is the goal, commit is optional. |
| **Decision > History** | Only Decision Rationale has real value. Implementation History is low-value log, losing it is OK. |
| **Better verbose than missing** | When unsure if rationale is needed, write it. Disk space is cheap, lost knowledge is not. |
| **Bootstrap safety** | SIFU must not block its own development. During dev, disable enforcement to avoid self-deadlock. |

## DNA Validation Rules

| Rule | Description |
|------|-------------|
| **Sidecar Existence** | Every non-`.dna.md` file needs a matching `.{filename}.dna.md` hidden sidecar. `.dna.md` files themselves are exempt. |
| **DNA ID Globally Unique** | DNA IDs use content-hash format `[DNA-<hash8>]`. Allocated and validated by `sifu-cli.js`, no global registry file. |
| **Append-Only** | No deletions allowed in `.dna.md` files. Use `DEPRECATED` to retire entries. |
| **Section Structure** | Each `.dna.md` must have `## Decision Rationale` and `## Implementation History`. See `docs/` for full format spec. |
| **Causal Order** | Implementation History refs can only reference IDs declared in the same file's Decision Rationale. |

## Open Questions: Agent Trust

| What SIFU guarantees | What SIFU does NOT guarantee |
|---------------------|------------------------------|
| DNA entry exists | DNA content is true |
| No deletions | Timestamps are accurate |
| Causal structure | Rationale is honest |

**Current stance**: Assume good-faith agents. Rely on audit for truth verification.

**Future options**: External witness, cryptographic signing, cross-agent verification.

---

# Agent Rules

## Entropy Reduction (CRITICAL)

- Rephrase and confirm the request before executing.
- Flag conflicts with prior decisions; request confirmation before switching approaches.
- Break multi-part requests into sub-tasks and confirm each step.
- List assumptions explicitly and ask user to validate.
- Summarize agreements in bullets for sign-off.

## Specification-Intention Principle

| Layer | Carrier | Enforced by |
|-------|---------|-------------|
| **Intention** (why) | `.dna.md` sidecar | SIFU — every write ships with rationale |
| **Specification** (what) | `docs/` | Human or agent, as needed |

**With user interaction:**
- Dialogue drives decisions, but decisions land in `.dna.md`, not in separate docs.
- Specs (design docs, interface definitions) still go in `docs/` for cross-file, system-level design.
- Collaboration remains conversational: confirm requirements, surface assumptions, iterate on approach. No need to separately record "what the user said" — SIFU captures rationale at every step.

**Without user interaction:**
- SIFU is the sole accountability mechanism. Every write action must ship rationale.
- No one to remind, no one to confirm. `.dna.md` is the evidence trail of agent reasoning.

## SubAgent Delegation

- **Never use sleep to wait**: Don't block main thread with `sleep` for long-running tasks.
- **Delegate monitoring to sub-agents**: Use `Task` tool with `run_in_background=true` for:
  - Waiting for training completion
  - Monitoring log files for specific events
  - Any task requiring polling/waiting
- **Design concise deliverables**: When prompting sub-agents, explicitly request:
  - Summary-only output (no raw logs)
  - Structured results (key metrics, pass/fail)
  - Bounded response length
  - Example: "Report: best_epoch, valid_ndcg, test_ndcg, pass/fail status. No verbose logs."

## SubAgent Progressive Delivery

Reports and analyses delivered in layers; readers drill down as needed:

| Level | Lines | Content |
|-------|-------|---------|
| 0: Verdict | 1 | "PASS: Goal achieved" |
| 1: TL;DR | 5 | Core conclusions |
| 2: Key Sections | 50 | Key findings |
| 3: Full Report | Full | Complete details |

**Reading Strategy** (when reading reports/docs):
1. **Verdict first**: Read first 2-5 lines for pass/fail status
2. **TL;DR next**: If verdict unclear, read first 10-20 lines for summary
3. **Sampling**: If still need more, read head + middle + tail sections
4. **Full read**: Only when absolutely necessary

> Principle: Minimize context consumption while getting enough info to decide.
> Also consider using search/grep tools to filter information when applicable.

## Code Style

- Prefer pure functions and immutable data when reasonable.
- Keep functions under ~40 lines unless a longer form improves clarity.
- Follow standard ESLint/Prettier conventions.
- Use TypeScript for all new code. Avoid `any` unless truly necessary.

## Code Review

- After implementing a feature, explicitly walk through key design decisions and edge cases.
- Don't assume user has reviewed every detail—they may trust the code blindly.
- When in doubt, highlight non-obvious implementation choices.
- Use ASCII diagrams or code snippets to show critical logic paths for user verification.

## Error Handling

- Add try-catch only around operations expected to fail (file I/O, network, etc.).
- No blanket or deeply nested exception handling.
- When updating or adding features, drop backward compatibility with legacy code.
- On detecting outdated usage, throw an `Error` that directs users to update.

## Testing

- Use `vitest` for all tests.
- Smoke tests MUST use minimal data and fast paths for quick iteration.
- For pure logic functions: cover main path and key edge cases.
- When feasible, implement a naive reference inside the test file and compare outputs.

## Environment

- Use `npm` for package management.
- Node.js 18+ required.
- Manage environment variables via `dotenv`. Never commit `.env`.

## Files & Documentation

**Files Management**
- Put new documents in `docs/`, except `CLAUDE.md` and `README.md`.
- Keep runnable shell scripts in `scripts/`.
- Store all tests under `tests/`.

**Documentation**
- Before naming a doc, run `date +%Y%m%d%H` to get the current timestamp.
- Put docs in `docs/` with format `yyyymmddhh_TITLE_IN_CAPS_WITH_UNDERSCORES.md`. Update existing docs rather than duplicating.
- **Document header**: Every doc MUST start with YAML frontmatter containing branch and commit:
  ```
  ---
  branch: main
  commit: abc1234
  ---
  ```
- Every public function/class needs a JSDoc docstring (params, returns, behavior).
- Capture decisions, experiments, and observations rigorously in docs.

**Document Archiving** (when docs get too long)
- Use copy-rename-compress-link pattern:
  1. Copy the original file to `{filename}_ARCHIVE.md`
  2. Surgically edit/compress the original, keeping only active content
  3. Add a link at top: `> Archived content: [ARCHIVE](./path_to_archive.md)`

## Git Workflow

- Use `gh` CLI for all GitHub operations when available; otherwise use `git` directly.
- Never commit `.env` (secrets).
- Commit after completing each meaningful feature or fix; don't accumulate too many changes.
- Before committing, review `git status` to avoid unintended deletions or additions.
- Commit message format: `type: description` (types: feat, fix, docs, refactor, test, chore).
- While the user acknowledges the credits of Claude, DO NOT include any information about Claude in the commit message.

## Modular Development

- Implement new functionality as self-contained modules that can be tested independently.
- Ensure tests pass and the module works in isolation before integrating it elsewhere.
- Use this incremental approach to minimize risk and enable iterative refinement.

## Codex Audit Process

All intermediate artifacts (docs, new code, sub-agent deliverables) should be sent through Codex audit before committing:

```
① Use /codex skill to dispatch audit to Codex agent (background, non-blocking).
② When Codex returns, use /receive-codex-audit skill to analyze the findings.
③ Decision:
   - 8/10 or above → pass, can commit
   - Below 8/10 → fix issues → re-audit (max 2 rounds)
   - Use own judgment → avoid excessive audit cycles
```

Key rules:
- Codex is slow (10+ min). **Never block the main thread** — always dispatch in background.
- All Codex interaction is wrapped inside a single haiku agent to avoid double-notification.
- See `/codex` skill (`.claude/skills/codex/SKILL.md`) for dispatch procedure.
- See `/receive-codex-audit` skill (`.claude/skills/receive-codex-audit/SKILL.md`) for analysis procedure.

## Security Rules

- **Never expose credentials**: Do not display API keys, tokens, or passwords in command output.
- **Never commit `.env`** or credential stores.
- **Stop on credential errors**: If authentication fails, stop immediately and let the user troubleshoot.
