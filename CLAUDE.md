# Project Overview

## Source of Truth

Full design details: `docs/2026011220_SIFU_DESIGN.md`

## Initiative

Build a minimal "kickstarter" for **DNA-first development**:
- **DNA (genotype)** is the durable intent/rationale history.
- **Code (phenotype)** is a disposable sample that can be regenerated from DNA.

The initial milestone is a tiny, plain-text system + tooling that makes AI-assisted coding safe and trackable by enforcing per-file `.dna` sidecars and an append-only global registry.

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

We explicitly **trade disk space for traceability and resilience**: keep fine-grained history in `.dna` files so implementations can be replaced without losing rationale.

## Core Philosophy

| Principle | Explanation |
|-----------|-------------|
| **DNA-first** | Decision before implementation, always. No code without DNA. |
| **Phenotype disposable** | Code can be deleted and regenerated from DNA anytime. |
| **Wrong is OK** | Bad DNA can exist; use `DEPRECATED` + new entry, never delete. |
| **Eventual consistency** | Local `.dna` can violate global rules if the violation is logged. |
| **Logging only** | SIFU enforces logging + append-only, not correctness. Audit handles correctness. |
| **No orphan code** | DNA comes first, so code always has lineage. Losing impl is OK, losing lineage is not. |

## DNA Content Structure

Each `.dna` file contains two layers:

**1. Decision Rationale**
- Why this file exists
- Design choices and constraints
- References to global `[DNA-###]` IDs from `SIFU.dna`

**2. Implementation History** (per agent session)
- `timestamp`: When
- `agent_id`: Who (which agent session)
- `decision_refs`: Why (which DNA IDs justify this change)
- `changes`: What (natural language, 10-50 words)

Example:
```
## Decision Rationale
- [DNA-001] This file handles user authentication.
- [DNA-005] Chose JWT for stateless scaling.

## Implementation History
### Session: 2026-01-13T14:30:00 / agent-claude-abc123
- Refs: [DNA-005]
- Changes: Added JWT validation in check_token()
```

## Roadmap

| Phase | Gate | Description |
|-------|------|-------------|
| **v0 (Kickstarter)** | Commit Gate | Pre-commit hook validates DNA integrity (~60 lines Python) |
| **v1** | Write Gate | SIFU wrapper intercepts tool calls before file writes |
| **v2 (if needed)** | Filesystem Gate | OS-level enforcement via FUSE |

**Vision**: Everyone opens SIFU before opening their agentic coding tool.

## Project Goals

1. Provide a minimal, working "kickstarter" repo skeleton for the Sifu DNA workflow.
2. Enforce "DNA integrity" at commit time (v0):
   - Every tracked code file has a matching sidecar `*.dna`.
   - New `.dna` entries reference existing global IDs in `SIFU.dna` (format: `[DNA-###]`).
   - `SIFU.dna` and `*.dna` files are append-only (no deletions in staged diffs).
3. Keep everything plain-text, grep-friendly, and easy for agents to consume.
4. Ship tests (Python `unittest`) for the validator logic.

## Project Structure

Planned minimal layout:

```
Sifu/
├── SIFU.dna              # Global DNA registry (shared rationales, IDs like [DNA-101])
├── CLAUDE.md             # Agent instructions (this file)
├── scripts/
│   └── sifu_check.py     # Pre-commit validator (~60 lines)
├── .githooks/
│   └── pre-commit        # Hook that calls validator
├── tests/                # unittest coverage
└── docs/
    └── 2026011220_SIFU_DESIGN.md  # Full design document
```

Per-file DNA sidecars:
```
src/
├── foo.py                # Code (phenotype, disposable)
├── foo.py.dna            # DNA (rationale + history, durable)
```

## Project Workflow

1. **Register a DNA ID**: append a new entry to `SIFU.dna` (`[DNA-###]` + rationale).
2. **Record decision**: append decision rationale to `<file>.dna` referencing that `[DNA-###]`.
3. **Implement**: write or regenerate the code freely (phenotype is disposable).
4. **Record session**: append implementation history to `<file>.dna` (timestamp, agent_id, changes).
5. **Validate**: run the checker locally (and via pre-commit).
6. **Commit**: pre-commit enforces integrity + append-only constraints.

## Project Tools

- Python 3
- `uv` for environments and dependency management
- `git` for version control and hooks
- `ripgrep` (`rg`) for fast text search

# Agent Rules

## Session Start

**Pending Questions Hook**
- At the start of every session, check if `.claude/PENDING.md` exists.
- If present, read it immediately and ask the listed questions to the user before doing new work.
- Once the user answers, delete or mark the questions as resolved in the file.
- Treat the pending-questions hook as a critical alignment mechanism; never ignore it.

---

## Entropy Reduction (CRITICAL)

- Rephrase and confirm the request before executing.
- Flag conflicts with prior decisions; request confirmation before switching approaches.
- Break multi-part requests into sub-tasks and confirm each step.
- List assumptions explicitly and ask user to validate.
- Summarize agreements in bullets for sign-off.

---

## Collaboration

- After meaningful edits, summarize progress and ask targeted questions.
- When user spots mistakes, acknowledge and fix immediately.
- Co-evolve solutions; treat collaboration as dialogue, not one-way report.
- Tie check-ins to concrete artifacts (files touched, behaviors changed) for quick verification.
- Remind the user to request a `yyyymmddhh_TITLE_IN_CAPS.md` generation or update the existing doc under `docs/` when appropriate.

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

---

## SubAgent Progressive Delivery

Reports and analyses delivered in layers; readers drill down as needed:

| Level | Lines | Content |
|-------|-------|---------|
| 0: Verdict | 1 | "PASS: Goal achieved" |
| 1: TL;DR | 5 | Core conclusions |
| 2: Key Sections | 50 | Key findings |
| 3: Full Report | Full | Complete details |

**Reading Strategy** (when reading reports/docs):
```python
# Step 1: Read verdict (first 2 lines)
verdict = Read(path, limit=2)
if verdict.contains("PASS") and high_confidence:
    return verdict  # Done

# Step 2: Read TL;DR (first 10 lines)
tldr = Read(path, limit=10)
if sufficient_for_decision:
    return tldr

# Step 3: Read key sections (head + mid + tail)
head = Read(path, limit=20)
mid = Read(path, offset=middle, limit=20)
tail = Read(path, offset=end-20, limit=20)
if sufficient_for_decision:
    return combined

# Step 4: Full read only if necessary
return Read(path)
```

---

## Code Style

- Prefer pure functions and dataclasses when reasonable.
- Keep functions under ~40 lines unless a longer form improves clarity for deep-learning code.
- Follow PEP-8, only deviating when clarity for DL-specific code demands it.

---

## Code Review

- After implementing a feature, explicitly walk through key design decisions and edge cases.
- Don't assume user has reviewed every detail—they may trust the code blindly.
- Before experiments, summarize what the code actually does vs. what user might expect.
- When experiments pass without issues, still highlight non-obvious implementation choices.
- Use ASCII diagrams or code snippets to show critical logic paths for user verification.

---

## Error Handling

- Add try-except only around expected failures (file I/O, network, etc.).
- No blanket or deeply nested exception handling.
- When changing APIs, refactor/delete old code immediately - no deprecations.
- On detecting outdated usage, raise `RuntimeError` with guidance to update.

---

## Testing

- Use Python's built-in `unittest` framework exclusively. NEVER use pytest.
- Smoke tests MUST use small resolution / small steps / minimal data for fast iteration.
- **For trainers/pipelines**: Use smoke tests (few steps, small resolution) to verify the flow works.
- **For pure logic functions**: Write unittest covering success path and key edge cases.
- When feasible, implement a naive reference inside the test file and compare outputs.

---

## Environment

- Use `uv` (not conda) for Python environments in this repo.
- Preferred local env: `.venv/` at the repo root.
- Typical commands:
  - Install `uv` (macOS): `brew install uv`
  - Create venv: `uv venv`
  - Install deps (when present): `uv sync` (or `uv pip install -r requirements.txt`)
  - Run tooling/tests: `uv run python -m unittest`
- Manage environment variables via `dotenv`.

### Security Rules
- **Never expose credentials**: Do not display API keys, tokens, or passwords in command output.
- **Stop on credential errors**: If authentication fails, stop immediately and let the user troubleshoot.

## Files & Documentation

**Files Management**
- Put new documents in `docs/`, except `CLAUDE.md` and `README.md`.
- Store reference papers in `papers/`.
- Keep runnable shell scripts in `scripts/`.
- Place reference code in `ref_codes/` (use as inspiration; do not copy verbatim).
- Store all tests under `tests/`.

**Documentation**
- Before naming a doc, run `date +%Y%m%d%H` to get the current timestamp.
- Put docs in `docs/` with format `yyyymmddhh_TITLE_IN_CAPS_WITH_UNDERSCORES.md`. Update existing docs rather than duplicating.
- Every public function/class needs a docstring (args, returns, behavior). Math notation OK.
- Capture decisions, experiments, and observations rigorously in docs.

**Document Archiving** (when docs get too long)
- Use copy-rename-compress-link pattern:
  1. Copy the original file to `{filename}_ARCHIVE.md`
  2. Surgically edit/compress the original, keeping only active content
  3. Add a link at top: `> Archived content: [ARCHIVE](./path_to_archive.md)`
- Use `/archive-doc` slash command to automate this process.

**Git Workflow**
- Prefer `gh` when available for GitHub operations; otherwise use `git` directly.
- Never commit `.env` (secrets).
- Commit after completing each meaningful feature or fix; don't accumulate too many changes.
- Before committing, review `git status` to avoid unintended deletions or additions.
- Commit message format: `type: description` (types: feat, fix, docs, refactor, test, chore).
- While the user acknowledges the credits of Claude, DO NOT include any information about Claude in the commit message.

---

## Manageable Milestones

- Keep the active milestone small and tractable.
- If the gap to the next big goal is large, refine it into smaller sub-milestones instead of jumping straight there.
- After finishing the current milestone, define the next set of sub-milestones.
- Balance big-picture roadmap awareness with flexible, stepwise execution.

---

## Modular Development

- Implement new functionality as self-contained modules that can be tested independently.
- Ensure tests pass and the module works in isolation before integrating it elsewhere.
- Use this incremental approach to minimize risk and enable iterative refinement.

---

## Toy-First Workflow

- Before building complex features, design simple toy examples that use minimal, clear code and are 100% correct.
- Discuss every toy design with the user before coding: describe scenario, inputs, outputs, and simplifications to get approval.
- After implementing a toy, run a quick smoke test (not unit tests) to verify the intended behavior and share the result.
- Archive validated toys under `ref_codes/` using `yyyyMMddHHmm_<name>` directory.
- Use archived toys as correctness references when extending to more complex cases; ensure parity on the simplified setting.

---

## Output Format & Presentation

**Output Format**
- Default to Markdown for prose; fenced Python for code snippets.
- Use LaTeX for math: \( inline \), \[ block \]. No Chinese in equations.
- Provide symbol cheat-sheets for complex formulas.

**ASCII Diagrams**
- When user asks to explain something complex, prefer ASCII box-and-arrow diagrams.
- Use table format for comparisons, flow format for pipelines.
- Keep diagrams compact but complete.
