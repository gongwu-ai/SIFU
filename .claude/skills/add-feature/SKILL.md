---
name: add-feature
description: 完整的功能开发流程 (需求确认->探索->设计->实现->验收->合并)。当用户要添加新功能、实现新特性时使用。
---

# Add Feature - 完整功能开发流程

## 输入参数
- `$ARGUMENTS`: 功能简要描述 (可选，用于初始化session)

## 流程概览

```
Step 0: 初始化
    |
    v
Step 1: 需求确认 (Requirement Convergence)
    |
    v
Step 2: 信息收集 + 初版设计I
    |
    v
Step 3: Audit Plan - 制定审计规格书
    |
    v
Step 4: 实现
    |
    v
Step 5: Audit验收循环
    |
    v
Step 6: 展示 + Merge + Housekeeping
```

## 步骤文档

按顺序执行以下步骤，每个步骤的详细说明在对应文件中：

1. @step0-init.md - 初始化session，检查进行中的session
2. @step1-requirement.md - 需求确认，与用户对齐理解
3. @step2-exploration.md - 探索代码库，制定初版设计
4. @step3-audit.md - 制定审计规格书，定义验收标准
5. @step4-impl.md - 根据设计实现功能
6. @step5-audit-exec.md - 执行审计验收
7. @step6-merge.md - 展示变更，合并到main

异常处理见 @error-handling.md

## Session 存储

所有session数据存储在 `.claude/feature-sessions/{session_id}/`:
- `progress.json` - 进度跟踪
- `env-snapshot.md` - 环境快照
- `git-snapshot.md` - Git状态快照
- `step{N}-*.md` - 各步骤记录

## 关键原则

1. **每步都要用户确认后才能进入下一步**
2. **遇到异常立即暂停，与用户一起排查**
3. **所有操作都要有记录**
4. **不处理upstream，由专门的命令处理**
