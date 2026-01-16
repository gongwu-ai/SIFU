# Step 3: Audit Plan - 制定审计规格书与环境准备

**目标**: 定义"如何证明代码是对的"

## 3.1 重新阅读报告

阅读 step1 和 step2 的文档，确保理解完整。

## 3.2 生成Audit Spec文档

创建 `docs/audit/{SESSION_ID}_SPEC.md`，包含以下结构：

```markdown
# Audit Specification: {FEATURE_NAME}

## 1. Overview
- Feature: {name}
- Session: {session_id}
- Created: {timestamp}
- Author: {user}

## 2. Parts Breakdown
[见3.3节表格]

## 3. Environment Requirements
[见3.4节]

## 4. Test Data Requirements
[见3.5节]

## 5. Success Criteria
[见3.6节]

## 6. Execution Order
[见3.7节]

## 7. Rollback Plan
[见3.8节]
```

## 3.3 分类定义Audit方式

将实现拆分为可审计的Part，每个Part指定audit方式：

| Part | 描述 | Audit方式 | 前置依赖 | 量化指标 | 定性结论 | 阈值 |
|------|------|-----------|----------|----------|----------|------|
| P1 | xxx | Human-readable | - | - | 代码清晰度 | 人工确认 |
| P2 | xxx | Code-level | P1 | 通过率 | 边界覆盖 | 100% pass |
| P3 | xxx | Smoke | P2 | 运行时间 | 无crash | <60s |
| P4 | xxx | Full-running | P3 | metric值 | 收敛性 | <阈值 |
| P5 | xxx | Parity-check | P3 | diff值 | 一致性 | rtol=1e-5 |

**Audit方式详解**:

| 方式 | 描述 | 适用场景 | 执行者 |
|------|------|----------|--------|
| **Human-readable** | 信息处理速度人可达，直接review代码/输出 | 逻辑简单、配置变更 | 用户 |
| **Code-level** | unittest/集成测试 | 纯函数、边界条件 | 自动 |
| **Smoke** | 小规模快速验证流程通畅 | 端到端流程、API调用 | 自动 |
| **Full-running** | 完整运行获取真实指标 | 性能验证、训练效果 | 自动 |
| **Parity-check** | 与参考实现/原有逻辑对比 | 重构、优化 | 自动 |

## 3.4 环境准备

定义audit所需的环境配置：

```markdown
## Environment Requirements

### Hardware
- GPU: {required_gpu} (e.g., A100-80GB)
- Memory: {required_mem}
- Disk: {required_disk}

### Software
- Python: {version}
- CUDA: {version}
- Dependencies: [list new deps if any]

### Configuration
- Config overrides for audit (e.g., smaller batch for smoke)
- Environment variables
```

## 3.5 测试数据准备

定义audit所需的测试数据：

```markdown
## Test Data Requirements

| Part | Data | Source | Size | Location |
|------|------|--------|------|----------|
| P3 (Smoke) | small_dataset | subset of train | 100 samples | data/smoke/ |
| P4 (Full) | full_dataset | existing | 10k samples | data/dw4/ |
| P5 (Parity) | reference_output | baseline run | - | results/baseline/ |
```

**数据准备checklist**:
- [ ] 数据文件存在且可访问
- [ ] 数据格式正确
- [ ] 参考输出已生成（如需parity check）

## 3.6 量化指标与成功标准

定义每个指标的判定标准：

```markdown
## Success Criteria

| Metric | Type | Threshold | Comparison | Notes |
|--------|------|-----------|------------|-------|
| test_pass_rate | % | 100% | >= | 所有unittest必须通过 |
| smoke_time | seconds | 60 | <= | 冒烟测试必须快速 |
| energy_w2 | float | 1.0 | <= | 比baseline改善 |
| memory_peak | GB | 40 | <= | 不超过原有内存 |
| parity_diff | float | 1e-5 | <= | 数值一致性 |
```

**判定逻辑**:
- ALL metrics pass -> Audit PASS
- ANY metric fail -> Audit FAIL, 记录失败原因

## 3.7 执行顺序与阻塞关系

定义audit的执行DAG：

```
+───────────────+
| P1: Human     | (用户确认后继续)
+───────┬───────+
        v
+───────────────+
| P2: Code-level| (unittest)
+───────┬───────+
        v
+───────────────+
| P3: Smoke     | (快速端到端)
+───────┬───────+
        v
   +────┴────+
   v         v
+──────+  +──────+
|P4:Full|  |P5:Par| (可并行)
+──────+  +──────+
```

**阻塞规则**:
- P1 必须人工确认后才能继续
- P2 失败则阻塞后续所有Part
- P3 失败则阻塞 P4, P5
- P4, P5 可并行执行

## 3.8 Rollback Plan

定义audit失败时的回滚策略：

```markdown
## Rollback Plan

### 单Part失败
1. 记录失败原因到 audit_report.md
2. 修复代码
3. 重新执行该Part

### 多次失败 (>3次)
1. 暂停，通知用户
2. 一起分析根因
3. 决定：继续修复 or 回滚重采样

### 回滚重采样
1. git checkout main
2. git branch -D feat/{session_id}
3. 创建新branch: feat/{session_id}_v{N}
4. 从 Step 3 或 Step 4 重新开始
5. 尝试不同的实现方案
```

## 3.9 验收结果存储设计

```
results/
└── {session_id}_audit/           # 不与现有实验重名
    ├── part1_human/
    │   └── review_notes.md
    ├── part2_code/
    │   └── test_output.log
    ├── part3_smoke/
    │   └── smoke_output.log
    ├── part4_full/
    │   └── metrics.json
    ├── part5_parity/
    │   └── diff_report.md
    └── audit_report.md           # 汇总报告
```

**audit_report.md 模板**:

```markdown
# Audit Report: {FEATURE_NAME}

## Summary
- Status: PASS/FAIL
- Date: {timestamp}
- Branch: {branch}
- Commit: {hash}

## Environment
- Python: {version}
- CUDA: {version}
- GPU: {name}

## Results by Part
| Part | Status | Metric | Value | Threshold | Notes |
|------|--------|--------|-------|-----------|-------|
| P1 | PASS | - | - | - | User confirmed |
| P2 | PASS | pass_rate | 100% | 100% | |
| ... |

## Detailed Logs
[links to part directories]
```

## 3.10 逐Part与用户确认

对每个Part的audit计划，**单独**向用户确认：

**确认项**:
1. 这个Part的audit方式合理吗？
2. 量化指标的阈值设多少？
3. 有遗漏的测试场景吗？
4. 执行顺序和阻塞关系正确吗？
5. 测试数据准备好了吗？

**确认格式**:
```
+─────────────────────────────────────────────────────+
| Part 2: Code-level Test                             |
+─────────────────────────────────────────────────────+
| 描述: {part_description}                            |
| 方式: unittest                                      |
| 前置: P1 Human-readable 确认后                      |
| 指标: test_pass_rate >= 100%                        |
| 数据: 无需额外数据                                  |
+─────────────────────────────────────────────────────+
| 确认此Part? [Y/n/修改]                              |
+─────────────────────────────────────────────────────+
```

## 3.11 开Branch

所有Part确认完毕后：
1. 询问用户：是否需要stage当前代码？(以防丢失)
2. 创建新branch: `feat/{session_id}`
3. 更新 progress.json 中的 branch 字段

## 3.12 记录

将完整audit计划写入：
- `.claude/feature-sessions/{session_id}/step3-audit-plan.md` (session内)
- `docs/audit/{SESSION_ID}_SPEC.md` (项目级，便于后续查阅)

**完成后更新 progress.json: step 3 = completed, step 4 = in_progress**
