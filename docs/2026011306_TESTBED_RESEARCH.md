# Testbed Research Report

**Date**: 2026-01-13
**Purpose**: 找到适合评估 SIFU 的 benchmark

---

## 评估需求

SIFU 需要的 testbed 特征：

| 需求 | 说明 |
|------|------|
| 长程多决策 | 单 agent 跨多 session，累积多个设计决策 |
| 多角色协作 | 多 agent 接力，DNA 作为唯一沟通渠道 |
| 轻量级 | 小 MacBook 能跑，Docker 环境小 |
| 可验收 | 有客观的成功标准，不是主观评价 |

---

## Benchmark 调查结果

### TIER 1: 最佳候选

#### 1. GitTaskBench ⭐
- **URL**: https://github.com/QuantaAlpha/GitTaskBench
- **任务**: 54 个真实 repo 级别工程任务
- **决策点**: 5-12 per task
- **磁盘**: 预估 <10GB，**实测 1.7GB（仅 repo clone）**
- **Docker**: 可选
- **优点**: 决策密度高，多步骤工作流
- **缺点**: 任务数少，社区小

#### 2. InterCode
- **URL**: https://intercode-benchmark.github.io/
- **任务**: 交互式 coding，带执行反馈
- **决策点**: 2-5 per task
- **磁盘**: <5GB
- **Docker**: 轻量
- **优点**: 最小 footprint
- **缺点**: 偏向单任务代码生成，非长程

#### 3. SWE-bench Lite
- **URL**: https://github.com/SWE-bench/SWE-bench
- **任务**: 300 个 GitHub issue 修复
- **决策点**: 3-8 per task
- **磁盘**: 30-50GB（lite 版），full 版 120GB+
- **Docker**: 必须
- **优点**: 成熟，社区大
- **缺点**: 对小 MacBook 仍然太大

### TIER 2: 中等候选

#### 4. NL2Repo-Bench
- **URL**: https://github.com/multimodal-art-projection/NL2RepoBench
- **任务**: 从自然语言生成完整 repo
- **决策点**: 10-15 per task（很高）
- **磁盘**: 未知
- **Docker**: 必须（OpenHands）
- **优点**: 极端任务复杂度
- **缺点**: 资源需求不明

#### 5. MARBLE (MultiAgentBench)
- **URL**: https://github.com/ulab-uiuc/MARBLE
- **任务**: 多 agent 协作/竞争
- **决策点**: 2-8 per agent
- **磁盘**: 未知
- **Docker**: 是
- **优点**: **唯一专注多 agent 协作的 benchmark**
- **缺点**: API 依赖，资源需求不明

### TIER 3: 不推荐

| Benchmark | 原因 |
|-----------|------|
| SWE-bench Full | 120GB+，太大 |
| AgentBench | 单环境要 16GB RAM |
| HumanEval 系列 | 单任务，无决策链 |
| GAIA | 需要 web browsing，非 coding |

---

## 决定

### [DNA-015] Testbed 选型

**选择**:

| 排名 | Benchmark | 用途 |
|------|-----------|------|
| 🥇 | **InterCode** | 最轻 (~3GB)，快速 demo |
| 🥈 | **GitTaskBench** | 决策密度高，深度 demo |

**计划**: 跑几个 task 做 showcase，给 SIFU 打广告。

### [DNA-016] SIFU 验证策略

多管齐下：
1. **Demo tasks** - InterCode/GitTaskBench 跑几个 task
2. **Dogfood** - 用 SIFU 管理 SIFU 开发
3. **真实项目** - 推广给真实用户使用

---

## 资源估算

| Benchmark | Clone | 运行环境 | 总计估算 |
|-----------|-------|----------|----------|
| GitTaskBench | 1.7GB | +5-10GB? | ~10GB |
| InterCode | ~100MB | ~2GB | ~3GB |
| SWE-bench Lite | ~500MB | 30-50GB | 30-50GB |

---

## 下一步

**GitTaskBench 已 clone，下次继续测试**

```
位置: /tmp/GitTaskBench (1.7GB)
任务: 54 个，如 Trafilatura_01, AnimeGANv3_01 等
运行: gittaskbench grade --taskid <task_id>
要求: conda + Python 3.10 + PyTorch (无需 Docker)
```

**计划**:
1. 创建 conda 环境
2. 选一个简单 task 跑 SIFU demo
3. 展示 DNA-first 工作流

---

## 测试进度 (2026-01-13)

### 环境配置

```bash
# GLM-4.7 API (智谱)
ANTHROPIC_AUTH_TOKEN="c07a6af74a74466ebfdfccdb71ee4ac3.yzPcqz2euw8R1BKK"
ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"

# 运行命令
claude --print --dangerously-skip-permissions "任务描述"
```

### 测试结果

| Task | 状态 | DNA-first | 输出正确 |
|------|------|-----------|----------|
| Faker_01 | ✅ 成功 | ✅ | ✅ 100 rows |
| Faker_02 | 🔄 进行中 | - | - |
| Faker_03 | ⏳ 待测 | - | - |

### 文件位置

```
/tmp/sifu-test/           # 测试工作目录
/tmp/GitTaskBench/        # GitTaskBench (1.7GB)
/tmp/GitTaskBench/.venv/  # Python 3.10 环境
```

### 测试结果更新

| Task | 状态 | DNA-first | 输出正确 |
|------|------|-----------|----------|
| Faker_01 | ✅ 成功 | ✅ | ✅ 100 rows |
| Faker_02 | ✅ 成功 | ✅ | ✅ 5 companies |
| Faker_03 | ⏳ 待测 | - | - |

**当前成功率: 2/2 = 100% (GLM-4.7)**

---

## 实验设计：SIFU 对弱模型的提升效果

### 假设

SIFU 的 DNA-first 约束能提升弱模型的任务成功率，因为：
1. 强制先思考（写 DNA）再行动（写代码）
2. 结构化的决策记录减少遗漏
3. 即使模型能力弱，流程保证了质量

### 实验计划

| 模型 | 无 SIFU 成功率 | 有 SIFU 成功率 | 提升 |
|------|----------------|----------------|------|
| GLM-4.5 | ? | ? | ? |
| GLM-4.5 Flash | ? | ? | ? |
| GLM-4.7 | baseline | 2/2 (100%) | - |

### 测试方法

```bash
# 有 SIFU（当前方法）
claude --print --dangerously-skip-permissions "按SIFU规则完成任务..."

# 无 SIFU（对照组）
claude --print --dangerously-skip-permissions "完成任务..." # 不提 DNA-first
```

### 待确认

- GLM-4.5 API endpoint 是否相同？
- GLM-4.5 Flash 是否存在？
- 需要跑多少 task 才有统计意义？（建议 10+）

### 下一步

1. 确认 GLM-4.5 / Flash 的 model name
2. 设计对照实验（有/无 SIFU）
3. 批量跑 10+ tasks
4. 统计成功率对比

---

## Sources

- [GitTaskBench GitHub](https://github.com/QuantaAlpha/GitTaskBench)
- [InterCode Benchmark](https://intercode-benchmark.github.io/)
- [SWE-bench](https://github.com/SWE-bench/SWE-bench)
- [NL2Repo-Bench](https://github.com/multimodal-art-projection/NL2RepoBench)
- [MARBLE](https://github.com/ulab-uiuc/MARBLE)
