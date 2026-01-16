# SIFU Agent Rules

This is the minimal CLAUDE.md template for SIFU-enabled projects.

---

## Core Philosophy

| Principle | Explanation |
|-----------|-------------|
| **DNA-first** | Decision before implementation, always. No code without rationale. |
| **Wrong is OK** | Bad decisions can exist; mark them `DEPRECATED`, never delete. |
| **宁滥勿缺** | When unsure if rationale is needed, write it. Lost knowledge is expensive. |

### Rationale Judgment

```python
if future_agent.看到这段代码().会问("为什么？"):
    需要_rationale = True
else:
    需要_rationale = False

# 不确定？写！
```

---

## Entropy Reduction (CRITICAL)

- Rephrase and confirm the request before executing.
- Flag conflicts with prior decisions; request confirmation before switching approaches.
- Break multi-part requests into sub-tasks and confirm each step.
- List assumptions explicitly and ask user to validate.
- Summarize agreements in bullets for sign-off.

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
- On detecting outdated usage, raise error with guidance to update.

---

## Modular Development

- Implement new functionality as self-contained modules that can be tested independently.
- Ensure tests pass and the module works in isolation before integrating it elsewhere.
- Use this incremental approach to minimize risk and enable iterative refinement.

---

## Toy-First Workflow

- Before building complex features, design simple toy examples that use minimal, clear code.
- Discuss every toy design with the user before coding: describe scenario, inputs, outputs, and simplifications to get approval.
- After implementing a toy, run a quick smoke test to verify the intended behavior and share the result.
- Use validated toys as correctness references when extending to more complex cases.

---

## Manageable Milestones

- Keep the active milestone small and tractable.
- If the gap to the next big goal is large, refine it into smaller sub-milestones.
- After finishing the current milestone, define the next set of sub-milestones.
- Balance big-picture roadmap awareness with flexible, stepwise execution.

---

## Collaboration

- After meaningful edits, summarize progress and ask targeted questions.
- When user spots mistakes, acknowledge and fix immediately.
- Co-evolve solutions; treat collaboration as dialogue, not one-way report.
- Tie check-ins to concrete artifacts (files touched, behaviors changed) for quick verification.
