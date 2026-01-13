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

---

## 智谱 Claude API 兼容模型

### 模型列表

| Model Name | 参数 | 上下文 | 输出 | 说明 |
|------------|------|--------|------|------|
| `glm-4.7` | - | 200K | 96K | 最新旗舰，SWE-bench 73.8% |
| `glm-4.6` | 355B MoE | 200K | - | 高级 agent/coding |
| `glm-4.5` | - | 128K | 96K | 通用 |
| `glm-4.5-air` | - | 128K | 96K | 性价比，CC 默认 Haiku |
| `glm-4.5-flash` | - | 128K | 96K | **免费版** |

**注意**: 没有 "GLM-4 Flash"，只有 `glm-4.5-flash`。

### API 配置

```bash
ANTHROPIC_AUTH_TOKEN="your_api_key"
ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
ANTHROPIC_MODEL="glm-4.5-flash"  # 指定模型
```

---

## 实验设计 v2

### 标准化 Prompt Template

#### 有 SIFU (Treatment)

```
你是一个遵循 SIFU DNA-first 工作流的 agent。

规则：
1. 在写任何代码文件之前，必须先创建对应的 .dna 文件（如 solution.py 需要先创建 solution.py.dna）
2. .dna 文件必须包含 ## Decision Rationale 和 ## Implementation History 两个部分
3. Decision Rationale 至少有一个 [DNA-xxx] 条目说明设计决策

任务：{TASK_DESCRIPTION}
```

#### 无 SIFU (Control)

```
任务：{TASK_DESCRIPTION}
```

### 任务描述 (TASK_DESCRIPTION)

| Task ID | 描述 |
|---------|------|
| Faker_01 | 使用本地的 Faker 库（位于 /tmp/GitTaskBench/code_base/Faker），生成100条假用户数据并保存为CSV文件，列名为 Username, Email。输出到 output.csv。 |
| Faker_02 | 使用本地的 Faker 库（位于 /tmp/GitTaskBench/code_base/Faker），生成5条假公司数据并保存为CSV文件，列名为 Company Name, Address, Phone。输出到 output.csv。 |
| Faker_03 | 使用本地的 Faker 库（位于 /tmp/GitTaskBench/code_base/Faker），将输入文件 /tmp/GitTaskBench/queries/Faker_03/input/Faker_03_input.txt 的内容替换为假文本，输出到 output.txt。 |

### 实验矩阵 (Faker 系列)

| 模型 | 实力 | Faker_01 SIFU | Faker_01 Ctrl | Faker_02 SIFU | Faker_02 Ctrl |
|------|------|---------------|---------------|---------------|---------------|
| glm-4.7 | 强 | ✅ | - | ✅ | - |
| glm-4.5-flash | 弱 | ✅ | ✅ | ✅ | - |

### 结论：Faker 任务太简单

**问题**: Faker 任务是 one-liner 级别，无论有无 SIFU 都能 100% 通过。

**观察**:
- glm-4.5-flash 无 SIFU 也能完成 Faker_01 ✅
- 任务不需要多步骤规划
- 没有设计决策点，只是调 API

**SIFU 真正价值场景**:

| 场景 | 为什么需要 SIFU |
|------|-----------------|
| 长程多 session | 跨 session 保持决策一致性 |
| 多步骤设计任务 | 强制先规划再实现，避免遗漏 |
| 多 agent 接力 | DNA 是唯一沟通渠道 |
| 弱模型 + 复杂任务 | 流程约束弥补能力不足 |

**下一步**: 寻找/设计更复杂的任务来 showcase SIFU

---

## Baseline 实验结果 (2026-01-13)

### glm-4.5-flash 无 SIFU

**配置**: 24 个任务，并发 ~20，无 SIFU prompt

| 状态 | 数量 | 任务 |
|------|------|------|
| ✅ 成功 | 17 | Eparse_01-03, NeuroKit_01-03, PDFPlumber_01-02, PyPDF2_01-03, Stegano_01/03, Trafilatura_01-02, Scrapy_01-02 |
| ❌ 429 限流 | 2 | PDFPlumber_03, Trafilatura_03 |
| ❓ 待确认 | 2 | Stegano_02, Scrapy_03 |
| ⏭️ 之前已跑 | 3 | Faker_01-03 (全过) |

**Process Success**: 19/21 = 90% (有输出)

### 关键概念：Process ≠ Result

| 指标 | 说明 | 示例 |
|------|------|------|
| **Process Success** | 代码跑通，有输出文件 | 生成了 output.csv |
| **Result Success** | 输出内容正确 | output.csv 内容与 groundtruth 匹配 |

**GPT-4o 官方成绩 37% 是 Result Success，不是 Process Success！**

这意味着：
- 代码跑通 ≠ 任务完成
- 必须用 `test_script.py` 验证输出正确性
- 我们的 90% Process Success 需要降级为 Result Success

### 验证结果 (Result Success) - 完整

**验证时间**: 2026-01-13 10:20

| 任务 | Process | Result | 说明 |
|------|---------|--------|------|
| Eparse_01 | ✅ | ❌ | 内容相似度 38.08% < 75% |
| Eparse_02 | ❌ | ❌ | 输出格式错误，解析失败 |
| Eparse_03 | ✅ | ✅ | 相似度 100% |
| NeuroKit_01 | ✅ | ✅ | 100% 准确，3/3 列匹配 |
| NeuroKit_02 | ✅ | ❌ | R/P peaks 数量不对 |
| NeuroKit_03 | ✅ | ❌ | 缺少 Mean_Respiratory_Rate 列 |
| PDFPlumber_01 | ✅ | ✅ | 通过 |
| PDFPlumber_02 | ✅ | ❌ | 列名/顺序不匹配 |
| PDFPlumber_03 | ✅ | ✅ | P/R/F1 = 100% |
| PyPDF2_01 | ✅ | ✅ | 文本准确度 99.81% |
| PyPDF2_03 | ❌ | ❌ | 输出文件异常 |
| Stegano_02 | ✅ | ❌ | 提取内容不匹配 |
| Trafilatura_01 | ✅ | ❌ | F1 0.76 < 0.9 阈值 |
| Scrapy_02 | ❌ | ❌ | 输出格式不匹配 |
| Scrapy_03 | ✅ | ❌ | XML 解析失败 |

### 最终统计 (glm-4.5-flash 无 SIFU)

| 指标 | 数值 | 对比 GPT-4o |
|------|------|-------------|
| **Process Success** | 12/15 = 80% | 53.7% |
| **Result Success** | 5/15 = **33.3%** | **37.0%** |

**结论**: glm-4.5-flash (免费) 的 Result Success (33.3%) 与 GPT-4o (37%) 基本持平！

> 验证命令: `python3 test_scripts/{task}/test_script.py --output {output} --groundtruth {gt} --result {jsonl}`

### 交叉验证 (Sonnet 3x Parallel)

为确保结果可靠，派出 3 个 Sonnet agent 并行验证：

| Validator | Tasks | Process ✅ | Result ✅ |
|-----------|-------|------------|-----------|
| A | Eparse_01-03, NeuroKit_01-02 | 4/5 | 2/5 |
| B | NeuroKit_03, PDFPlumber_01-03, PyPDF2_01 | 5/5 | 3/5 |
| C | PyPDF2_03, Stegano_02, Trafilatura_01, Scrapy_02-03 | 3/5 | 0/5 |
| **Total** | 15 | **12/15 (80%)** | **5/15 (33.3%)** |

**交叉验证确认结果一致** ✅

### 实验文件位置

```
/tmp/sifu-test/baseline/          # 21个任务的输出
/tmp/sifu-test/exp/               # 之前 Faker SIFU 实验
/tmp/GitTaskBench/                # benchmark 代码库
/tmp/GitTaskBench/test_scripts/   # 验证脚本
/tmp/GitTaskBench/groundtruth/    # 标准答案
```

### 验证命令

```bash
cd /tmp/GitTaskBench
python3 test_scripts/{task}/test_script.py \
  --groundtruth groundtruth/{task}/gt.csv \
  --output /tmp/sifu-test/baseline/{task}/output.csv \
  --verbose
```

### 下一步

1. 跑完所有任务的 Result 验证
2. 统计真正的 Result Success 率
3. 对失败任务跑 SIFU 对比实验
4. 更新 doc

### 已完成的任务列表

**Baseline (无 SIFU) 最终结果**:
- Eparse_01, 02, 03 ✅✅✅
- NeuroKit_01, 02, 03 ✅✅✅
- PDFPlumber_01, 02, 03 ✅✅✅
- PyPDF2_01, 02, 03 ✅✅✅
- Scrapy_01 ❌, 02 ✅, 03 ✅
- Stegano_01, 02, 03 ✅✅✅
- Trafilatura_01 ✅, 02 ✅, 03 ❌

**Process Success: 19/21 = 90%**

**SIFU 实验已跑**:
- Faker_01 SIFU ✅, noSIFU ✅
- Faker_02 SIFU ✅

### API 配置

```bash
ANTHROPIC_AUTH_TOKEN="c07a6af74a74466ebfdfccdb71ee4ac3.yzPcqz2euw8R1BKK"
ANTHROPIC_BASE_URL="https://open.bigmodel.cn/api/anthropic"
ANTHROPIC_MODEL="glm-4.5-flash"
```

---

## GitTaskBench 官方 Benchmark

### GPT-4o + OpenHands 成绩

| 配置 | Process Success | Result Success |
|------|-----------------|----------------|
| 100 iters | 53.70% | **37.04%** |
| 70 iters | 50.00% | 33.33% |
| 30 min | 50.00% | 35.19% |
| 30 iters | 44.44% | 33.33% |
| 20 min | 46.30% | 35.19% |

**结论**: GPT-4o 最高也只有 37% 成功率，说明任务确实有难度。

### 各任务通过情况 (GPT-4o 100 iters)

**✅ 通过 (20/54)**:
- Faker: 01, 02, 03 (全过)
- Stegano: 01, 02, 03 (全过)
- Scrapy: 01, 02, 03 (全过)
- PyPDF2: 01, 02, 03 (全过)
- PDFPlumber: 01, 03
- Trafilatura: 02, 03
- Eparse: 02
- FunASR: 01
- TransparentBackground: 03
- InvisibleWatermark: 02

**❌ 失败 (GPT-4o 也搞不定)**:
- NeuroKit: 01, 02, 03 (全挂)
- Trafilatura: 01
- PDFPlumber: 02
- Eparse: 01, 03
- InvisibleWatermark: 01, 03

**未测试 (25个)**: Image/Video/Speech Processing 系列

### 代码库 + 模型大小

| Repo | 代码 | 模型 | 总计 | 状态 |
|------|------|------|------|------|
| AnimeGANv3 | 154M | **4M** (已有) | ~160M | ✅ 可跑 |
| InvisibleWatermark | 4.7M | **1.6M** (已有) | ~6M | ✅ 可跑 |
| DeOldify | 1.4M | **~2GB** (需下载) | ~2GB | ⚠️ 需下载 |
| FunASR | 81M | **~500M** (需下载) | ~600M | ⚠️ 需下载 |
| SpeechBrain | 58M | **1-2GB** (HF下载) | ~2GB | ⚠️ 需下载 |
| StyleTransfer | 21M | **~500M** (VGG19) | ~500M | ⚠️ 自动下载 |
| SuperResolution | 14M | **100-500M** | ~500M | ⚠️ 需下载 |
| TransparentBackground | 146M | **~200M** (估计) | ~350M | ⚠️ 需下载 |
| DeScratch | 39M | **未知** | ? | ⚠️ 待查 |
| VideoPose3D | 304K | **未知** | ? | ⚠️ 待查 |
| **不需要模型** |
| Trafilatura | 148M | - | 148M | ✅ 可跑 |
| NeuroKit | 27M | - | 27M | ✅ 可跑 |
| Stegano | 19M | - | 19M | ✅ 可跑 |
| PDFPlumber | 19M | - | 19M | ✅ 可跑 |
| PyPDF2 | 17M | - | 17M | ✅ 可跑 |
| Faker | 11M | - | 11M | ✅ 可跑 |
| Scrapy | 5.2M | - | 5M | ✅ 可跑 |
| Eparse | 432K | - | 432K | ✅ 可跑 |

**模型下载估算**: ~6-7GB (如果跑所有需要模型的任务)

### M4 MacBook CPU 并发压力

| 场景 | 并发数 | 预估 |
|------|--------|------|
| 不需要模型的任务 | 10 | ✅ 无压力 |
| CPU 推理任务 (AnimeGAN等) | 3-5 | ⚠️ 可能较慢 |
| 混合任务 | 5-10 | 🔄 需测试 |

### 有价值的测试任务

**推荐 (GPT-4o 失败 = 有难度)**:
- NeuroKit_01, NeuroKit_02, NeuroKit_03
- Trafilatura_01
- PDFPlumber_02
- Eparse_01, Eparse_03
- InvisibleWatermark_01, InvisibleWatermark_03

这些任务 GPT-4o + OpenHands 都过不了，如果 SIFU 能帮助弱模型通过，就能体现价值。

---

### 成功标准

| Task | 验证方法 |
|------|----------|
| Faker_01 | output.csv 存在，101 行（1 header + 100 data），列名 Username,Email |
| Faker_02 | output.csv 存在，6 行（1 header + 5 data），列名 Company Name,Address,Phone |
| Faker_03 | output.txt 存在，内容为假文本 |

### DNA-first 验证

有 SIFU 条件下额外检查：
- 存在 `*.dna` 文件
- 包含 `## Decision Rationale` 和 `## Implementation History`
- 至少一个 `[DNA-xxx]` 条目

---

---

## Round 1: SIFU 对比实验 (探索性)

### 实验配置

- **模型**: glm-4.5-flash (免费)
- **Harness**: Claude Code + Haiku subagent
- **重复次数**: 1 次 (探索性)
- **任务**: 10 个 baseline 失败的任务

### Prompt Template

**Baseline (无 SIFU)**:
```
任务：使用 XXX 库，从 input 提取数据，输出到 output.xxx
工作目录：/tmp/sifu-test/baseline/{task}/
```

**SIFU**:
```
你是一个遵循 SIFU DNA-first 工作流的 agent。

规则：
1. 在写任何代码文件之前，必须先创建对应的 .dna 文件
2. .dna 文件必须包含 ## Decision Rationale 和 ## Implementation History
3. Decision Rationale 至少有一个 [DNA-xxx] 条目说明设计决策

任务：使用 XXX 库，从 input 提取数据，输出到 output.xxx
参考 groundtruth 格式：{GT_PATH}  ← Round 1 有此行，Round 2 去掉
工作目录：/tmp/sifu-test/sifu/{task}/
```

### Round 1 结果 (One-Shot)

| Task | Baseline | SIFU | 变化 |
|------|----------|------|------|
| Stegano_02 | ❌ | ✅ | +1 |
| Eparse_02 | ❌ | ✅ (87.5%) | +1 |
| Scrapy_02 | ❌ | ✅ (100%) | +1 |
| Eparse_01 | ❌ | ❌ (格式) | 0 |
| PyPDF2_03 | ❌ | ✅ (100%) | +1 |
| NeuroKit_03 | ❌ | ❌ (Peak) | 0 |
| Scrapy_03 | ❌ | ✅ (100%) | +1 |
| NeuroKit_02 | ❌ | ❌ (50%) | 0 |
| Trafilatura_01 | ❌ (F1=0.76) | ✅ (F1=0.90) | +1 |
| PDFPlumber_02 | ❌ | ✅ (100%) | +1 |

### Round 1 统计

| 指标 | Baseline | SIFU | 提升 |
|------|----------|------|------|
| Result Success | 0/10 (0%) | **7/10 (70%)** | **+70%** |

### Round 1 局限性

1. **额外 GT 提示**: SIFU prompt 包含 groundtruth 路径参考
2. **单次执行**: 每个条件只跑 1 次，有随机性
3. **非严格对照**: 两组 prompt 除 SIFU 规则外还有细微差异

### 亮点

- **Trafilatura_01**: F1 从 0.76 → 0.90，DNA 记录了 4 轮迭代
- **PDFPlumber_02**: 完美匹配 (byte-for-byte identical)
- **Scrapy_02/03**: 100% match

---

## Round 2: 严格对照实验 (待执行)

### 实验设计改进

1. **去掉 GT 提示**: 两组 prompt 只差 SIFU 规则
2. **重复 5 次**: 统计平均成功率 + 标准差
3. **严格对照**: 任务描述完全一致

### Prompt Template (Round 2)

**Baseline**:
```
任务：{TASK_DESCRIPTION}
工作目录：/tmp/sifu-test/r2/baseline/{task}_run{N}/
```

**SIFU**:
```
你是一个遵循 SIFU DNA-first 工作流的 agent。

规则：
1. 在写任何代码文件之前，必须先创建对应的 .dna 文件
2. .dna 文件必须包含 ## Decision Rationale 和 ## Implementation History
3. Decision Rationale 至少有一个 [DNA-xxx] 条目说明设计决策

任务：{TASK_DESCRIPTION}
工作目录：/tmp/sifu-test/r2/sifu/{task}_run{N}/
```

### 执行计划

- **快任务** (8个): Stegano_02, Eparse_01/02, NeuroKit_02/03, PyPDF2_03, Scrapy_02/03
- **慢任务** (2个): Trafilatura_01, PDFPlumber_02 (最后跑)
- **并发**: 10 个/批
- **预估时间**: 1-1.5 小时

---

## Sources

- [GitTaskBench GitHub](https://github.com/QuantaAlpha/GitTaskBench)
- [InterCode Benchmark](https://intercode-benchmark.github.io/)
- [SWE-bench](https://github.com/SWE-bench/SWE-bench)
- [NL2Repo-Bench](https://github.com/multimodal-art-projection/NL2RepoBench)
- [MARBLE](https://github.com/ulab-uiuc/MARBLE)
