

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

- Always work inside the conda env `msampler`.
- Source `/opt/miniconda3/etc/profile.d/conda.sh` and `conda activate msampler` before any command.
- Install Python packages with `pip install <pkg> -i https://pypi.mirrors.ustc.edu.cn/simple/`.
- Manage environment variables via `dotenv`.
- When using Hugging Face, always export `HF_ENDPOINT=https://hf-mirror.com`.
- `.env` keys: `SWANLAB_KEY` (SwanLab).

### Security Rules
- **Never expose credentials**: Do not display API keys, tokens, or passwords in command output.
- **Stop on credential errors**: If authentication fails, stop immediately and let the user troubleshoot.

---

## Training Workflow

### Session-Independent Background Jobs (CRITICAL)

**Always use nohup for long-running jobs** to survive session disconnects:

```bash
# GOOD - survives disconnect
mkdir -p logs
nohup bash -c 'source /opt/miniconda3/etc/profile.d/conda.sh && conda activate msampler && python -m msampler.train --system.name lj13 --stage remd' > logs/lj13_remd.log 2>&1 &
echo "PID: $!"

# BAD - dies on disconnect
python -m msampler.train --system.name lj13 --stage remd 2>&1 | tee logs/lj13.log &
```

**Check job status**:
```bash
ps aux | grep "msampler.train" | grep -v grep
tail -f logs/lj13_remd.log  # monitor progress (interactive)
```

**⚠️ Check tqdm progress from log file**:
```bash
# WRONG: tail reads stale data (tqdm \r becomes append in file)
tail -1 logs/lj13_remd.log | grep -oP '\d+:\d+:\d+'  # ❌ outdated ETA

# CORRECT: use strings to get latest progress
strings logs/lj13_remd.log | grep -oP '\d+/100000' | tail -1  # ✅ actual progress
```

### General Guidelines

- After starting, provide the `tail` command for user to monitor progress.
- User monitors; agent doesn't need to actively check unless asked.
- **Checkpoint naming**: Query `date +%Y%m%d_%H%M%S` and include timestamp in checkpoint dir (e.g., `{exp_name}_{timestamp}/`).
- Before training: run `nvidia-smi` to confirm GPU availability.

### Distributed Training (DDP)
- **Use file-based init**, not TCP init (TCP may fail with "Connection reset by peer")
- Single-GPU training does not require DDP init

```python
import tempfile
import torch.distributed as dist

# ✅ File-based init (recommended for shared storage clusters)
with tempfile.TemporaryDirectory() as tmpdir:
    init_file = f'file://{tmpdir}/dist_init'
    dist.init_process_group(backend='nccl', init_method=init_file, rank=rank, world_size=world_size)

# ❌ TCP init - may fail on some machines
# dist.init_process_group(backend='nccl', init_method='env://')
```

### Configuration Management and Logging
- Use `tyro` library to manage configurations with python built-in Dataclass, also implement handy yaml config loading.
- Use `swanlab` library to log training progress and metrics.

### Resource Management
- Check GPU memory before training: `nvidia-smi` or `torch.cuda.memory_summary()`
- For smoke tests, use small resolution and few steps to quickly verify.
- Log memory usage and step time during training for monitoring.

### Debugging Shape/Device Errors
- On shape mismatch: Print shapes of all related tensors.
- On device mismatch: Check `.device` of all input tensors.
- Reference official pipeline source code to understand expected behavior.
- When stuck, compare with working reference implementations.

---

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
- Use `gh` CLI for all git operations (auth already configured via `gh auth setup-git`).
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