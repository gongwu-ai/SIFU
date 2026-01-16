# Step 5: Audit验收循环

## 5.1 执行Audit

按照 step3 的计划，逐Part执行audit。

## 5.2 结果记录

每次audit后：
1. 创建结果目录: `results/{session_id}_audit/`
2. 记录详细结果到 `audit_report.md`:
   - 入参
   - 使用的code hash/branch/commit
   - 详细eval结果
   - 量化指标
   - 定性结论

## 5.3 Commit

每轮audit完成后commit：
```
git add .
git commit -m "audit: {part_name} - {pass/fail}"
```

## 5.4 失败处理

**单次失败**: 修改代码，重新audit

**多次失败**:
1. 通知用户
2. 一起调查根因
3. 如进入死胡同 -> 回滚，重新开branch"采样"

## 5.5 记录

更新 `step5-audit-results.md`

**完成后更新 progress.json: step 5 = completed, step 6 = in_progress**
