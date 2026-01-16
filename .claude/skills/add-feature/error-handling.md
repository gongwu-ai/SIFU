# 异常流程

## 回滚流程

当需要回滚时：
1. `git checkout main`
2. `git branch -D feat/{session_id}` (删除失败的branch)
3. 重新创建新branch: `feat/{session_id}_v2`
4. 更新 progress.json
5. 从 step 3 或 step 4 重新开始

## 中断恢复流程

当检测到未完成的session时：
1. 读取 progress.json
2. 展示当前进度给用户
3. 询问：
   - 从最后记录的step继续？
   - 从用户指定的step开始？
   - 放弃此session？

## 常见错误处理

### Git冲突
1. 展示冲突文件
2. 与用户一起解决
3. 记录解决方案

### 依赖安装失败
1. 记录错误信息
2. 尝试替代源或版本
3. 如无法解决，通知用户

### Audit失败
1. 记录失败详情
2. 分析根因
3. 根据 step3 的 Rollback Plan 执行

### 环境问题
1. 对比 env-snapshot.md
2. 识别差异
3. 恢复或更新环境
