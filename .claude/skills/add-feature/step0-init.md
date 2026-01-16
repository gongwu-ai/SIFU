# Step 0: 初始化

## 0.1 检查是否有进行中的session

检查 `.claude/feature-sessions/` 下是否有未完成的session：
- 如果有，询问用户：
  - 继续该session？(从最后记录进展开始)
  - 从用户指定的步骤开始？
  - 放弃并开始新session？

## 0.2 创建新session (如需要)

1. 生成 session_id: `{date}_{feature_short_name}` (如 `20260114_new_feature`)
2. 创建目录: `.claude/feature-sessions/{session_id}/`
3. 初始化 `progress.json`:

```json
{
  "session_id": "{session_id}",
  "feature_name": "$ARGUMENTS",
  "created_at": "{timestamp}",
  "current_step": 0,
  "steps": {
    "0": {"status": "in_progress"},
    "1": {"status": "pending"},
    "2": {"status": "pending"},
    "3": {"status": "pending"},
    "4": {"status": "pending"},
    "5": {"status": "pending"},
    "6": {"status": "pending"}
  },
  "branch": null,
  "original_branch": "{current_branch}",
  "staged_before_start": false,
  "new_dependencies": []
}
```

## 0.3 记录环境快照

创建 `env-snapshot.md`:

```markdown
# Environment Snapshot

## Python
- Version: {python --version}
- Conda env: {conda info --envs | grep '*'}

## CUDA
- Version: {nvcc --version}
- GPU: {nvidia-smi --query-gpu=name --format=csv,noheader}

## Dependencies
{pip freeze}
```

## 0.4 记录Git状态快照

创建 `git-snapshot.md`:

```markdown
# Git Snapshot

- Branch: {git branch --show-current}
- Commit: {git rev-parse HEAD}
- Commit message: {git log -1 --format=%s}
- Dirty files: {git status --porcelain}
```

## 0.5 询问用户

- 是否需要性能基线？(默认否)
  - 如果是，记录当前性能指标到 `baseline.md`

**完成后更新 progress.json: step 0 = completed, step 1 = in_progress**
