---
name: receive-codex-audit
description: "Analyze Codex audit/review opinions. Codex provides independent second opinions from a different model. Use to avoid co-mode errors and process audit results."
---

# /receive-codex-audit - Analyze Codex Audit Results

Triggered after receiving a Codex audit deliverable. Classifies findings, verifies MUST-FIX items, evaluates SHOULD-FIX ROI, and produces an actionable report.

## Trigger

User invokes `/receive-codex-audit` or `/rca` after a Codex audit completes.

---

## Codex as Auditor

### Strengths

- **Independent perspective**: Does not share context with the main agent — a truly independent second opinion.
- **Code audit**: Catches real bugs (in-place ops, gradient breaks, target leaks, logic errors).
- **Logical reasoning**: Causal chain analysis, internal contradiction detection.
- **Methodology review**: Experiment design, threshold definitions, delivery criteria.

### Known Biases

1. **Over-strictness**: May flag reasonable design choices as MUST-FIX.
2. **Missing context**: Only sees what was sent — may not know about upstream logic, project conventions, or global state.
3. **Severity inflation**: Sometimes escalates SHOULD-FIX to MUST-FIX out of caution.

**Core principle: Codex MUST-FIX items require verification. SHOULD-FIX items are usually sound.**

---

## Analysis Flow

### Step 1: Classify Findings

Categorize each Codex finding:
- **MUST-FIX**: Verify one by one — real bug or false positive?
- **SHOULD-FIX**: Evaluate ROI — cost of fix vs risk of not fixing.
- **Methodology suggestions**: Assess practicality under current constraints.

### Step 2: Verify MUST-FIX

For each MUST-FIX:
1. **Read the relevant code** to confirm the issue actually exists.
2. Check if Codex missed context (upstream calls, global state, project conventions).
3. Verdict: confirmed bug / false positive / downgrade to SHOULD-FIX.

### Step 3: Evaluate SHOULD-FIX

For each SHOULD-FIX:
- Cost of change (lines, blast radius)
- Risk of not changing (does it affect correctness?)
- Worth fixing under current time pressure?

### Step 4: Output Report

```markdown
## Codex Audit Analysis

### MUST-FIX Verification
1. [Issue] - ✅ Confirmed / ❌ False Positive / ⚠️ Downgraded to SHOULD-FIX
   - Codex said: ...
   - Verification: ...
   - Action: ...

### SHOULD-FIX Evaluation
1. [Issue] - ✅ Accept / ⏭️ Skip (reason)
   - ROI: ...

### Methodology Suggestions
1. [Suggestion] - ✅ Adopt / ⚠️ Partial / ⏭️ Not practical
   - Reason: ...

### Context Codex Missed
- [Info Codex didn't have]

### Action List
- [ ] fix 1
- [ ] fix 2
```

### Step 5: Wait for User Confirmation

**Do NOT auto-execute any changes.** Wait for user approval.

---

## Notes

1. **MUST-FIX items must be verified one by one** — Codex false positive rate is ~10-20%.
2. **SHOULD-FIX items are usually sound** — Codex engineering intuition is generally reliable.
3. **Methodology suggestions need practicality filter** — Codex may be overly conservative.
4. **Context matters** — Codex only sees what was sent to it.
5. **Respect user's final decision.**
