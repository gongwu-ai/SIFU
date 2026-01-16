# Step 6: 展示 + Merge + Housekeeping

## 6.1 文件树展示

用ASCII文件树展示所有变更：
```
{project}/
├── {module_a}/
│   ├── file1.py      <- MODIFIED (+N lines) {change_description}
│   └── file2.py      <- MODIFIED (+N lines) {change_description}
├── {module_b}/
│   └── file3.py      <- MODIFIED (+N lines) {change_description}
└── ...
```

## 6.2 与main对比

展示 `git diff main...HEAD --stat`

## 6.3 逐部分确认

对每个修改的文件，向用户展示变更内容，确认无异常。

## 6.4 询问用户

1. 是否有其他合作者需要review？
   - 是 -> 建议创建PR
   - 否 -> 直接merge

2. 是否需要更新CLAUDE.md？
   - 是 -> 更新相关section
   - 否 -> 跳过

## 6.5 Merge到main

```
git checkout main
git merge feat/{session_id} --no-ff -m "feat: {feature_name}"
```

**注意**: 不处理upstream，由 `/cherry-pick-upstream` 或 `/push-upstream` 处理

## 6.6 Housekeeping (可选)

询问用户是否需要housekeeping：
- 清理临时文件
- 删除feature branch
- 其他清理

**必须显式确认每项操作，不允许静默执行**

## 6.7 收尾

1. 记录新安装的依赖，提醒用户后续更新到upstream
2. 回到原branch（如果不是main）
3. 如果开始前有staged内容，提醒用户

**完成后更新 progress.json: step 6 = completed**

## 6.8 生成最终文档

创建 `docs/{yyyymmddhh}_FEATURE_NAME_IMPLEMENTATION.md`:
- 功能概述
- 实现方案
- Audit结果汇总
- 使用方法
- 新增依赖
