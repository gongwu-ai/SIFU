# Step 1: 需求确认 (Requirement Convergence)

## 1.1 Agent理解展示

基于 `$ARGUMENTS` 和上下文，展示对功能的理解：

```
+─────────────────────────────────────────+
| 我理解你要添加的功能是:                  |
|                                         |
| [功能名称]: {name}                       |
| [功能目的]: {purpose}                    |
| [预期效果]: {expected_outcome}           |
| [影响范围]: {scope}                      |
|                                         |
| 是什么:                                 |
|   - {point_1}                           |
|   - {point_2}                           |
|                                         |
| 不是什么:                               |
|   - {not_point_1}                       |
|   - {not_point_2}                       |
+─────────────────────────────────────────+
```

## 1.2 用户反馈循环

询问用户：
- 以上理解正确吗？
- 有什么需要补充或修正？

重复展示和反馈，直到用户确认"收敛"。

## 1.3 记录

将最终确认的需求写入 `step1-requirement.md`

**完成后更新 progress.json: step 1 = completed, step 2 = in_progress**
