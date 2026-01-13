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

1. 清理 /tmp 的 clone
2. 更新 SIFU.dna 记录决策
3. 继续完善 SIFU 本身
4. 等待真实用户/项目来验证

---

## Sources

- [GitTaskBench GitHub](https://github.com/QuantaAlpha/GitTaskBench)
- [InterCode Benchmark](https://intercode-benchmark.github.io/)
- [SWE-bench](https://github.com/SWE-bench/SWE-bench)
- [NL2Repo-Bench](https://github.com/multimodal-art-projection/NL2RepoBench)
- [MARBLE](https://github.com/ulab-uiuc/MARBLE)
