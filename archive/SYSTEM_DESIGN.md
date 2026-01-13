# Research Copilot System Design

> 一个为深度学习科研项目设计的 AI 协作系统，解决跨会话上下文丢失、知识外化、多任务协调等问题。基于贝叶斯推断框架。

**Document Metadata**
- Version: 0.8.0
- Created: 2025-12-17T16:00
- Last Modified: 2025-12-17T20:30
- Update Count: 7
- Previous Versions: [None - Initial]

---

## Symbol Table (符号速查表)

| Symbol | Name | Meaning |
|--------|------|---------|
| $\Theta$ | 假设空间 | 所有可能的研究路径/结论 |
| $\theta \in \Theta$ | 假设 | 一个具体的研究假设/方向 |
| $\theta^*$ | 真实假设 | 实际正确的那个（未知） |
| $\omega_t$ | 观测 | 第 t 步获得的信息（实验结果、讨论、发现） |
| $\omega_{<t}$ | 观测历史 | 截至 t-1 的所有观测 |
| $P(\theta \mid \omega)$ | 后验 | 给定观测历史，对假设的信念分布 |
| $H(\theta \mid \omega)$ | 后验熵 | 给定观测后对假设的剩余不确定性（要最小化） |
| $I(\theta; \omega)$ | 互信息 | 观测提供的关于假设的信息量（要最大化） |
| $\Delta^+$ | 信息增益 | $I(\theta; \omega_t \mid \omega_{<t})$ |
| $\Delta^-$ | 不确定性注入 | 新问题/外部变化带来的不确定性 |
| $V_H(\theta)$ | 人类价值函数 | 定义哪些假设值得关心 |
| $a_t$ | 动作 | 第 t 步的决策 |
| $P(a \mid \omega)$ | 动作分布 | 来自对最优动作 $a^*$ 的信念不确定性 |
| $L_{\text{ctx}}$ | 上下文限制 | 单次可处理的信息量上限 |

> 完整符号定义见 [MANIFESTO_MATHEMATICAL.md](./MANIFESTO_MATHEMATICAL.md)

---

# Part I: System Manifesto (系统纲领)

> **完整数学形式化见**: [MANIFESTO_MATHEMATICAL.md](./MANIFESTO_MATHEMATICAL.md)

本节提供纲领的直观概述。严格的符号定义和方程见数学纲领文档。

## Φ.0 Objective Function (目标函数)

**核心公式**:

$$
\mathcal{J}(\pi) = \underbrace{\mathbb{E}\left[ \sum_t H(\theta \mid \omega_{\leq t}) \right]}_{\text{对假设的后验不确定性}} - \beta \cdot \underbrace{\mathbb{E}\left[ \sum_t V_H(\theta) \right]}_{\text{假设的人类价值}}
$$

$$
\pi^* = \arg\min_\pi \mathcal{J}(\pi)
$$

| 符号 | 含义 |
|---|------|
| $\theta \in \Theta$ | 假设：所有可能的研究路径/结论 |
| $\omega_t$ | 观测：第 t 步获得的信息（实验结果、讨论、发现）|
| $H(\theta \mid \omega)$ | 后验熵：给定观测后对假设的剩余不确定性（要最小化）|
| $I(\theta; \omega)$ | 互信息：观测与假设的相关性（等价于最大化）|
| $V_H(\theta)$ | 人类价值函数：定义哪些假设值得关心 |
| $\beta(t)$ | 权衡参数（Agent + Human 共同决定，随项目阶段变化）|

**系统目标**: 最小化对假设的后验不确定性 ≡ 最大化与假设的互信息，同时聚焦于人类认为有价值的假设空间

---

## Φ.1 Core Thesis: Bayesian Inference over Hypotheses

**系统的本质**: 科研是一个对假设空间进行贝叶斯推断的过程，通过收集观测 ω 来最大化互信息 I(θ;ω)，等价于减少后验不确定性 H(θ|ω)。

```
┌─────────────────────────────────────────────────────────────────┐
│               POSTERIOR ENTROPY REDUCTION MODEL                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Initial: H(θ|ω₀) = High, I(θ;ω₀) = Low                        │
│       │   (对假设高度不确定，观测与假设关联弱)                    │
│       │                                                         │
│       │  Observation Gathering (收集观测)                       │
│       │  ├── Exploration (探索)                                 │
│       │  ├── Experiments (实验)                                 │
│       │  └── Discussion (讨论)                                  │
│       ▼                                                         │
│  Intermediate: H(θ|ω) 降低, I(θ;ω) 增加                         │
│       │                                                         │
│       │  Information Gain: Δ⁺ = I(θ; ω_t | ω_{<t})              │
│       │  ├── Decisions (决策) ← 大幅信息增益                    │
│       │  ├── Insights (洞见) ← 高互信息                         │
│       │  └── Conclusions (结论)                                 │
│       ▼                                                         │
│  Final: H(θ|ω_T) → Low, I(θ;ω_T) → High                        │
│         (对假设确定，后验集中于正确假设)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Φ.2 Information Monotonicity Principle (信息单调性原则)

**核心约束**: 系统已获知的总体信息量必须单调不减。

```
┌─────────────────────────────────────────────────────────────────┐
│  I_total(t) ≤ I_total(t+1)   ∀t                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Raw Information Layer (原始信息层)                              │
│  └── 永久保存，不可删除，只可归档                                 │
│      ├── 实验日志、对话记录、代码变更                            │
│      └── 保证: 任何决策都可追溯到原始依据                         │
│                                                                 │
│  Condensed Information Layer (浓缩信息层)                        │
│  └── 向上传递时必然损失细节，但保留决策关键信息                    │
│      ├── 压缩是有损的，但损失的是低信息价值内容                   │
│      └── 高信息价值内容 (洞见、决策依据) 必须保留                 │
│                                                                 │
│  Decision Layer (决策层)                                         │
│  └── 接收浓缩信息，做出决策                                      │
│      ├── 决策所需信息量 << 原始信息量                            │
│      └── 但决策本身产生巨大减熵效果                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Φ.3 Information Value Hierarchy (信息价值层级)

**高价值信息** (高互信息 I(ω;θ)，使用后减熵效果显著):

| 类型 | 来源 | 示例 | 减熵效果 |
|------|------|------|---------|
| **Surprising Discovery** | 实验结果 | "VQ 的 temp=0.1 比 0.5 好 3x" | ★★★★★ |
| **Decision Resolution** | 讨论共识 | "选择 FiLM-VQ 而非 Gumbel" | ★★★★☆ |
| **Insight** | 分析推理 | "分布偏移是本质瓶颈" | ★★★★☆ |
| **Blocking Issue Resolution** | 调试 | "bug 在 worker_init_fn" | ★★★☆☆ |
| **Routine Update** | 日常记录 | "完成了 epoch 100" | ★☆☆☆☆ |

### Φ.4 Information Generation Modes (信息生成模式)

```
┌─────────────────────────────────────────────────────────────────┐
│  ACTIVE Generation (主动生成)                                    │
├─────────────────────────────────────────────────────────────────┤
│  触发: 人类主导或 Main Agent 发起                                │
│  形式:                                                          │
│  ├── 周会/Review: 多 Agent 协作研究特定问题                      │
│  ├── 专题探索: 派遣 Agent 调研某个方向                           │
│  └── 主动总结: 定期回顾产出浓缩知识                              │
│  特点: 目标明确，产出质量高                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PASSIVE Generation (被动生成)                                   │
├─────────────────────────────────────────────────────────────────┤
│  触发: 子任务执行过程中自然产生                                   │
│  形式:                                                          │
│  ├── 子任务报告: 执行过程中发现的意外洞见                        │
│  ├── 错误分析: 失败中学到的教训                                  │
│  └── 副产品: 探索 A 时意外发现了 B                               │
│  特点: 不可预测，但可能包含高价值信息                            │
└─────────────────────────────────────────────────────────────────┘
```

### Φ.5 Value Function & Decision Boundary (价值函数与决策边界)

**人类作为价值函数**: 限制系统的决策空间，确保方向正确。

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALUE FUNCTION V(s, a)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  s = system state (当前知识状态)                                 │
│  a = action (可选决策/方向)                                      │
│  V(s, a) = human preference (人类偏好/价值判断)                  │
│                                                                 │
│  Agent 职责:                                                    │
│  ├── 探索 action space，收集信息                                │
│  ├── 压缩信息，呈现给人类                                       │
│  └── 执行人类批准的 action                                      │
│                                                                 │
│  人类职责:                                                       │
│  ├── 定义 V(s, a): 什么是好的方向？                             │
│  ├── 在关键决策点提供 V 值判断                                  │
│  └── 动态调整 V: 随着认知更新偏好                               │
│                                                                 │
│  决策边界:                                                       │
│  ├── Agent 自主: 低风险、可逆、常规操作                         │
│  ├── 需确认: 中等风险、资源消耗大                               │
│  └── 必须人类: 高风险、不可逆、战略方向                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Φ.6 DAG-Structured Progress (DAG 结构化进展)

**系统演进遵循 DAG 拓扑**:

```
                    ┌─────────┐
                    │ Goal G  │ (最终目标，最低熵)
                    └────▲────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
       ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
       │ Mile M1 │  │ Mile M2 │  │ Mile M3 │
       └────▲────┘  └────▲────┘  └────▲────┘
            │            │            │
       ┌────┴────┐       │       ┌────┴────┐
       │ Task T1 │───────┤       │ Task T3 │
       └────▲────┘       │       └────▲────┘
            │       ┌────┴────┐       │
            └───────│ Task T2 │───────┘
                    └────▲────┘
                         │
                    ┌────┴────┐
                    │ Start S │ (初始状态，最高熵)
                    └─────────┘

DAG 节点类型:
├── Start: 项目启动，最大不确定性
├── Task: 具体任务，执行后减熵
├── Milestone: 里程碑，阶段性熵降低确认
└── Goal: 最终目标，熵最小化
```

### Φ.7 System Invariants (系统不变量)

```
┌─────────────────────────────────────────────────────────────────┐
│  INVARIANTS (必须始终满足的约束)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  I-1: Observation Accumulation (观测单调积累)                    │
│       ω_{≤t} ⊆ ω_{≤t+1} — 原始观测永不丢失                      │
│                                                                 │
│  I-2: Posterior Entropy Reduction (后验熵最终减少)               │
│       E[H(θ|ω_T)] < H(θ|ω_0) — 终态对假设更确定                 │
│       (允许局部探索暂时增加不确定性)                             │
│                                                                 │
│  I-3: Decision Traceability (决策可追溯)                         │
│       ∀d, ∃ trace(d) → ω_raw — 任何决策可追溯到原始观测         │
│                                                                 │
│  I-4: Human Oversight (人类认可)                                 │
│       d ∈ D_strategic ⇒ V_H(d) > 0 — 战略决策需人类价值认可     │
│                                                                 │
│  I-5: Context Boundedness (上下文有界)                           │
│       |ω_active| ≤ L_ctx — 活跃上下文有明确边界                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Φ.8 Considerations & Open Questions (待考虑问题)

> **DL Researcher 补充**: 以下是对系统纲领的补充思考和可能缺失的元素。

#### Φ.8.1 Feedback Loop & Error Correction (反馈回路与纠错)

**当前缺失**: 系统描述了从高熵到低熵的单向流动，但缺少反馈机制。

```
┌─────────────────────────────────────────────────────────────────┐
│  FEEDBACK MECHANISMS (需补充)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Decision Feedback:                                             │
│  ├── 决策执行后的结果如何反馈回系统？                            │
│  ├── 如果决策错误，如何回滚或修正？                              │
│  └── 错误决策的代价如何量化？                                    │
│                                                                 │
│  Exploration vs Exploitation:                                   │
│  ├── 局部探索可能暂时增加熵 (这是允许的)                         │
│  ├── 但需要机制确保最终回归减熵轨道                              │
│  └── 如何判断 "探索够了，该决策了"？                             │
│                                                                 │
│  [TBD: 具体的反馈协议设计]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Φ.8.2 Information Staleness (信息时效性)

**当前缺失**: 信息有时效性，旧信息可能变得不相关甚至误导。

```
┌─────────────────────────────────────────────────────────────────┐
│  INFORMATION FRESHNESS (需补充)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  问题:                                                          │
│  ├── 3 个月前的实验结论可能已被新结果推翻                        │
│  ├── 旧的架构决策可能不再适用                                    │
│  └── 累积的 "知识" 可能包含过时信息                              │
│                                                                 │
│  可能的解决:                                                     │
│  ├── 信息衰减: 旧信息权重随时间降低                              │
│  ├── 显式失效: 标记某些信息为 "deprecated"                       │
│  ├── 定期 Review: 周期性验证关键知识的有效性                     │
│  └── Conflict Detection: 新旧信息冲突时触发警告                  │
│                                                                 │
│  [TBD: 具体的信息时效管理协议]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Φ.8.3 Attention Allocation (注意力分配)

**当前缺失**: 不是所有信息都同等重要，如何分配 Agent 注意力？

```
┌─────────────────────────────────────────────────────────────────┐
│  ATTENTION ALLOCATION (需补充)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  问题:                                                          │
│  ├── 信息过载时，Agent 应该关注什么？                            │
│  ├── 多个任务并行时，如何分配注意力？                            │
│  └── 如何避免 "捡芝麻丢西瓜"？                                   │
│                                                                 │
│  可能的解决:                                                     │
│  ├── Priority Queue: 任务/信息按优先级排序                       │
│  ├── Importance Scoring: 信息重要性评分机制                      │
│  ├── Context Window Auction: 上下文空间竞价分配                  │
│  └── Human Override: 人类可以强制调整注意力焦点                  │
│                                                                 │
│  [TBD: 具体的注意力分配协议]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Φ.8.4 Posterior Entropy Measurement (后验熵度量)

**已解决**: 后验熵 H(θ|ω) 的代理指标设计见 [MANIFESTO_MATHEMATICAL.md Part C](./MANIFESTO_MATHEMATICAL.md#part-c-posterior-entropy-proxy-design-后验熵代理设计)

```
┌─────────────────────────────────────────────────────────────────┐
│  H(θ|ω) PROXY DESIGN (已设计)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  组合代理: Ĥ(θ|ω) = λ_Q·H_Q + λ_D·H_D + λ_doc·H_doc            │
│                                                                 │
│  Component Proxies:                                             │
│  ├── H_Q: 基于未解决问题 (Open Questions Count)                 │
│  ├── H_D: 基于待决策事项 (Decision Backlog)                     │
│  └── H_doc: 基于文档不确定性 (TBD count, uncertainty density)   │
│                                                                 │
│  信息增益 Δ⁺ = I(θ; ω_t | ω_{<t}):                              │
│  ├── 解决 P0 问题 = 3.0                                         │
│  ├── 做出关键决策 = 2.0                                         │
│  └── 完成里程碑 = 5.0                                           │
│                                                                 │
│  初始权重: λ_Q=0.5, λ_D=0.3, λ_doc=0.2                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Φ.8.5 DAG Dynamics (DAG 的动态性)

**当前缺失**: 科研中 DAG 不是静态的，会随认知更新而变化。

```
┌─────────────────────────────────────────────────────────────────┐
│  DYNAMIC DAG MANAGEMENT (需补充)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  现实情况:                                                       │
│  ├── 计划: A → B → C → D                                        │
│  ├── 实际: A → B → 发现问题 → 回退 A → A' → E (新方向)           │
│                                                                 │
│  需要支持:                                                       │
│  ├── DAG 重构: 允许添加/删除/修改节点和边                        │
│  ├── 回溯: 支持回到之前的节点重新探索                            │
│  ├── 分支: 支持同时探索多个可能方向                              │
│  └── 合并: 分支探索后合并结论                                    │
│                                                                 │
│  记录要求:                                                       │
│  ├── 每次 DAG 变更都要记录原因                                   │
│  ├── 保留 DAG 历史版本                                           │
│  └── 变更应触发人类确认 (战略方向变化)                           │
│                                                                 │
│  [TBD: DAG 版本控制和变更协议]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Φ.8.6 Value Function Dynamics (价值函数的动态性)

**当前缺失**: 人类的价值判断不是静态的，会随项目进展而演化。

```
┌─────────────────────────────────────────────────────────────────┐
│  VALUE FUNCTION EVOLUTION (需补充)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  现实情况:                                                       │
│  ├── 项目初期: 重视探索，容忍失败                                │
│  ├── 项目中期: 重视稳定进展                                      │
│  ├── 项目末期 (deadline): 重视交付，规避风险                     │
│                                                                 │
│  价值函数需要:                                                   │
│  ├── 版本化: V1, V2, ... 随时间更新                              │
│  ├── 显式化: 不能只在人类脑中，要写出来                          │
│  ├── 可解释: Agent 需要理解为什么某些方向被否决                  │
│  └── 可查询: Agent 可以询问 "这个方向人类会接受吗？"             │
│                                                                 │
│  [TBD: 价值函数的表示和更新协议]                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# Part II: System Design (系统设计)

## 0. Core Principles (核心原则)

### 0.1 Timestamp Awareness (时间可知性)

**原则**: Agent 必须在任何时刻都能感知当前时间，以便：
- 正确命名文档 (YYYYMMDDHH_*)
- 追踪任务时序
- 判断信息新鲜度
- 关联事件因果

**实现要求**:

```
┌─────────────────────────────────────────────────────────────────┐
│  Timestamp Injection Points                                     │
├─────────────────────────────────────────────────────────────────┤
│  1. Tool Call Response  │ 每个工具返回应包含执行时间戳           │
│  2. User Message        │ 用户输入自动附加时间戳                 │
│  3. Document Header     │ 所有文档必须包含 Created/Modified 时间 │
│  4. Session Start       │ 会话开始时获取并记录当前时间           │
└─────────────────────────────────────────────────────────────────┘
```

**Agent 行为规范**:
- 会话开始时，首先执行 `date +%Y-%m-%dT%H:%M:%S` 获取时间
- 创建任何文档前，获取时间戳用于命名
- 重要决策点记录时间戳
- 长任务执行前后记录时间，计算耗时

### 0.2 Progressive Delivery (渐进式交付)

[详见 Section 5]

### 0.3 Context Budget Management (上下文预算管理)

**原则**: 主 Agent 的上下文是稀缺资源，必须严格管理

```
上下文预算分配:
├── Global Context (20%)    │ 项目背景、架构、规则
├── Session Focus (30%)     │ 当前任务、pending questions
├── Working Memory (40%)    │ 当前讨论、临时信息
└── Buffer (10%)            │ 预留给意外情况
```

---

## 1. Problem Statement

### 1.1 当前痛点

| 痛点 | 描述 | 严重程度 |
|-----|------|---------|
| Onboarding 重复 | 每次新会话都需重新解释项目背景 | 4/5 |
| 上下文爆炸 | 长对话导致关键信息被稀释 | 5/5 |
| 知识丢失 | 讨论中的洞见未被记录 | 4/5 |
| 任务管理混乱 | 多个实验/子任务难以追踪 | 3/5 |
| 信息不同步 | Human 和 Agent 对项目状态理解不一致 | 3/5 |

### 1.2 设计目标

1. **零 Onboarding** — 新会话自动加载必要上下文
2. **知识持久化** — 讨论产出自动外化到文档
3. **上下文可控** — 主 Agent 不会被细节淹没
4. **人类主导** — Human-in-the-loop 决策关键节点

---

## 2. Context Hierarchy (三层上下文)

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 0: Global Context (项目级，跨所有会话，低细节)            │
│  ├── CLAUDE.md              项目背景、架构、规则 (Onboarding)    │
│  ├── PROJECT_TRACKING.md    里程碑追踪、进度概览 (无细节)        │
│  ├── DECISION_INDEX.md      所有决策的索引 (指向详细文档)        │
│  └── docs/                  归档的知识文档                       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Session Context (会话级，可能多任务并行)               │
│  ├── .claude/session_focus.md    当前会话的多个焦点任务          │
│  ├── .claude/pending_questions.md 跨会话待解决问题 (分优先级)    │
│  ├── .claude/active_tasks.md     进行中的任务列表                │
│  └── .claude/session_history/    会话摘要归档                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Task Context (任务级，Sub-Agent 执行时)                │
│  ├── 任务输入摘要 (精简)                                        │
│  ├── 执行过程记录                                               │
│  └── 交付报告 (结构化，支持渐进式读取)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Layer 0: Global Context (全局上下文)

**设计原则**:
- **低细节，高概括** — 提供 Onboarding 所需的项目背景，不含实现细节
- **索引优先** — 指向详细文档，而非内嵌所有内容
- **稳定性** — 不频繁变动，只在重大里程碑时更新

#### 2.1.1 CLAUDE.md (项目背景 + Agent 规则)

```markdown
# 核心内容 (from existing CLAUDE.md)

## Project Overview (Onboarding 必读)
- 项目目标、核心问题
- 当前阶段、最佳配置

## Architecture (高层设计)
- 核心创新点 (1-2 段)
- 架构图 (ASCII)
- 关键模块说明

## Codebase Structure
- 目录结构
- 关键文件位置

## Quick Commands
- 环境激活
- 常用训练/测试命令

## Agent Rules
- 协作规范
- 代码风格
- 工作流程
```

#### 2.1.2 PROJECT_TRACKING.md (进度追踪，无细节)

```markdown
# Project Tracking

## Current Milestone
- 名称: [当前里程碑]
- 目标: [一句话描述]
- 状态: [进行中/已完成/阻塞]

## Milestone History (最近 5 个)
| Date | Milestone | Status | Key Result |
|------|-----------|--------|------------|
| ... | ... | ... | ... |

## Blocked Items (需要关注)
- [阻塞项 1] → 原因: ...
- [阻塞项 2] → 原因: ...

## Links to Details
- 详细实验记录: docs/experiment_*.md
- 决策记录: docs/decision_*.md
```

#### 2.1.3 DECISION_INDEX.md (决策索引)

```markdown
# Decision Index

| ID | Date | Topic | Decision | Doc Link |
|----|------|-------|----------|----------|
| D001 | 2025-12-10 | VQ 架构选择 | FiLM-VQ | docs/decision_D001.md |
| D002 | 2025-12-15 | 训练策略 | 3-Stage | docs/decision_D002.md |
| ... | ... | ... | ... | ... |

## Pending Decisions
- [待决策 1]: 选项 A vs B → 讨论中
- [待决策 2]: ... → 等待实验结果
```

### 2.2 Layer 1: Session Context (会话上下文)

**设计原则**:
- **多任务并行** — 一个会话可能同时处理多个任务
- **优先级驱动** — 任务和问题都有优先级标记
- **跨会话连续** — pending_questions 跨会话持续存在

#### 2.2.1 session_focus.md (当前会话焦点)

```markdown
# Session Focus
- Session Start: YYYY-MM-DDTHH:MM
- Last Update: YYYY-MM-DDTHH:MM

## Active Tasks (本会话进行中的任务)

### Task 1: [任务名称] [P0/P1/P2]
- 目标: [一句话]
- 状态: [进行中/阻塞/待验收]
- 预期交付: [交付物]
- 相关文档: [链接]

### Task 2: [任务名称] [P1]
- ...

## Session Constraints (本次不做)
- [明确排除的范围]

## Context from Previous Session
- 上次结论: [简述]
- 遗留问题: → 见 pending_questions.md
```

#### 2.2.2 pending_questions.md (跨会话待解决问题)

```markdown
# Pending Questions
- Last Update: YYYY-MM-DDTHH:MM

## P0: Critical (阻塞进度)
- [ ] [Q001] [问题描述]
  - Created: [时间]
  - Context: [为什么重要]
  - Blocking: [阻塞了什么任务]

## P1: Important (应尽快解决)
- [ ] [Q002] [问题描述]
  - Created: [时间]
  - Context: [背景]

## P2: Nice-to-have (有空再解决)
- [ ] [Q003] [问题描述]

## Resolved (待归档到 docs/)
- [x] [Q000] [已解决问题]
  - Resolved: [时间]
  - Resolution: [解决方案简述]
  - Archived to: docs/xxx.md
```

#### 2.2.3 active_tasks.md (全局任务追踪)

```markdown
# Active Tasks
- Last Update: YYYY-MM-DDTHH:MM

## In Progress
| Task ID | Name | Priority | Started | Owner | Status |
|---------|------|----------|---------|-------|--------|
| T001 | ... | P0 | 2025-12-17 | Human | 进行中 |
| T002 | ... | P1 | 2025-12-17 | Agent | 等待验收 |

## Completed Today
| Task ID | Name | Completed | Deliverable |
|---------|------|-----------|-------------|
| T000 | ... | 2025-12-17T14:00 | docs/xxx.md |

## Blocked
| Task ID | Name | Blocked By | Since |
|---------|------|------------|-------|
| T003 | ... | Q001 | 2025-12-16 |
```

### 2.3 Layer 2: Task Context

**Sub-Agent 任务输入格式**:

```markdown
# Task: [任务名称]

## Objective (1-2 sentences)
[明确的任务目标]

## Input
- 相关文件: [路径]
- 关键约束: [约束]

## Expected Output
- 格式: [report/code/decision]
- 交付位置: [路径]

## Context Budget
- 可读取的文件: [列表]
- 禁止读取: [列表，避免上下文爆炸]
```

---

## 3. Document Offload Protocol (知识外化)

### 3.1 核心原则

```
细粒度 (对话中) ──────────────────────► 粗粒度 (归档)
  实时讨论              摘要提炼              持久文档
  高带宽                压缩                  低带宽读取
```

**关键原则**:
1. **不冗余插入** — 新增内容直接 append，不重复已有信息
2. **修改必存档** — 任何修改/删除操作前，必须保存旧版本
3. **版本可追溯** — 每个文档记录 update count 和历史链接
4. **阈值浓缩** — 文档过长时自动触发浓缩流程

### 3.2 触发时机

| 触发条件 | 动作 | 文档类型 |
|---------|------|---------|
| 重要决策达成 | 立即记录 | decision_*.md |
| 实验完成 | 结果归档 | experiment_*.md |
| 会话结束 | 摘要 offload | session_summary_*.md |
| 发现新洞见 | 知识记录 | insight_*.md |
| 文档超过阈值 | 浓缩 + 归档 | 见 Section 3.5 |

### 3.3 Document Versioning Protocol (文档版本控制)

#### 3.3.1 操作类型与处理规则

```
┌─────────────────────────────────────────────────────────────────┐
│  Operation Types & Rules                                        │
├─────────────────────────────────────────────────────────────────┤
│  INSERT (新增内容)                                              │
│  ├── 规则: 直接 append 到文档末尾                               │
│  ├── 不需要: 复制旧版本                                         │
│  └── 更新: Update Count +1, Last Modified 时间                  │
├─────────────────────────────────────────────────────────────────┤
│  MODIFY (修改现有内容)                                          │
│  ├── 规则: 先复制旧版本到 .archive/，再修改                     │
│  ├── 旧版本命名: {filename}_v{n}.md                             │
│  └── 更新: Update Count +1, Previous Version 链接              │
├─────────────────────────────────────────────────────────────────┤
│  DELETE (删除内容)                                              │
│  ├── 规则: 同 MODIFY，先存档再删除                              │
│  └── 删除的内容在旧版本中保留                                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 文档 Metadata 标准格式

每个文档必须包含以下 header:

```markdown
# [Document Title]

**Document Metadata**
- Version: [major.minor.patch]
- Created: [YYYY-MM-DDTHH:MM]
- Last Modified: [YYYY-MM-DDTHH:MM]
- Update Count: [N]
- Previous Versions:
  - v1: .archive/{filename}_v1.md (YYYY-MM-DD)
  - v2: .archive/{filename}_v2.md (YYYY-MM-DD)
- Line Count: [N] (用于判断是否需要浓缩)

---

[正文内容]
```

#### 3.3.3 版本存档目录结构

```
docs/
├── .archive/                    # 历史版本存档
│   ├── decision_D001_v1.md
│   ├── decision_D001_v2.md
│   └── experiment_E003_v1.md
├── decision_D001.md             # 当前版本
├── experiment_E003.md
└── ...
```

### 3.4 文档模板

#### 3.4.1 通用报告模板 (Progressive Reading)

```markdown
# [Title]

## Verdict (1 line)
[PASS/FAIL/NEEDS_DISCUSSION]: 一句话结论

## TL;DR (5 lines max)
- Point 1
- Point 2
- Point 3

## Key Findings
### Finding 1
[10-20 lines]

### Finding 2
[10-20 lines]

## Details (按需读取)
[完整细节，可能很长]

## Next Steps
- [ ] Action 1
- [ ] Action 2

## Metadata
- Created: [timestamp]
- Author: [human/agent]
- Related: [links to other docs]
```

#### 3.4.2 决策记录模板

```markdown
# Decision: [决策标题]

## Context
[为什么需要做这个决策]

## Options Considered
1. **Option A**: [描述]
   - Pros: ...
   - Cons: ...
2. **Option B**: [描述]
   - Pros: ...
   - Cons: ...

## Decision
选择 Option [X]

## Rationale
[选择的理由]

## Consequences
- [后续影响 1]
- [后续影响 2]
```

#### 3.4.3 实验记录模板

```markdown
# Experiment: [实验名称]

## Hypothesis
[要验证的假设]

## Setup
- Config: [配置]
- Baseline: [对比基准]
- Metric: [评估指标]

## Results

| Config | Metric 1 | Metric 2 | Notes |
|--------|----------|----------|-------|
| ... | ... | ... | ... |

## Conclusion
[假设是否成立，为什么]

## Next Steps
- [ ] [后续动作]
```

### 3.5 Document Condensation Protocol (文档浓缩)

当文档变得过于臃肿时，需要触发浓缩流程以保持可读性和上下文效率。

#### 3.5.1 浓缩触发条件

```
┌─────────────────────────────────────────────────────────────────┐
│  Condensation Triggers                                          │
├─────────────────────────────────────────────────────────────────┤
│  Line Count Threshold                                           │
│  ├── Warning: > 300 lines    → 提醒考虑浓缩                     │
│  ├── Recommend: > 500 lines  → 强烈建议浓缩                     │
│  └── Required: > 800 lines   → 必须浓缩才能继续更新             │
├─────────────────────────────────────────────────────────────────┤
│  Update Count Threshold                                         │
│  └── > 10 updates           → 考虑整合为更简洁版本              │
├─────────────────────────────────────────────────────────────────┤
│  Age + Activity                                                 │
│  └── > 30 days old + < 2 reads/month → 考虑归档或浓缩           │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.5.2 浓缩流程

```
原文档 (docs/topic_X.md, 600 lines)
    │
    ▼
Step 1: 存档原文档
    └── 移动到 docs/.archive/topic_X_full_YYYYMMDD.md
    │
    ▼
Step 2: 创建浓缩版本
    └── 新建 docs/topic_X.md (目标: < 200 lines)
    │
    ▼
Step 3: 添加链接
    └── 浓缩版本中添加 "Full History" 链接指向存档
```

#### 3.5.3 浓缩版本格式

```markdown
# [Topic X] (Condensed)

**Document Metadata**
- Version: 2.0.0 (Condensed from v1.x)
- Created: [原创建时间]
- Condensed: [浓缩时间]
- Full History: .archive/topic_X_full_YYYYMMDD.md

---

## Summary (浓缩后的核心内容)
[保留最重要的信息，删除过时或次要内容]

## Key Decisions (保留重要决策)
[只保留仍然相关的决策]

## Current Status (当前状态)
[反映最新状态]

---

> **Note**: 完整历史记录见 [Full History](.archive/topic_X_full_YYYYMMDD.md)
```

#### 3.5.4 浓缩原则

1. **保留**: 仍然相关的结论、决策、当前状态
2. **删除**: 过时的讨论、已被推翻的假设、冗余细节
3. **合并**: 多次小更新合并为一个综述
4. **链接**: 任何被删除的重要细节都应能通过历史链接找回

---

## 4. Multi-Agent Architecture

### 4.1 Agent 角色

```
┌─────────────────────────────────────────────────────────────────┐
│                      Main Agent (主 Agent)                      │
│  职责:                                                          │
│  - 与人类用户直接对话                                            │
│  - 任务分解与分配                                                │
│  - 交付物验收与整合                                              │
│  - 上下文管理 (防止爆炸)                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Sub-Agents (子 Agent)                        │
├─────────────────────────────────────────────────────────────────┤
│  Explorer Agent    │ 代码探索、文件搜索、上下文收集              │
│  Executor Agent    │ 执行具体任务 (编码、测试、实验)             │
│  Reviewer Agent    │ 代码审查、结果验证                         │
│  Scribe Agent      │ 文档撰写、知识 offload                     │
│  [TBD: 其他角色]   │                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 协作模式

#### Mode A: Voting (输入复杂，交付简单)

```
Task ──┬──► Agent 1 ──► Result 1 ──┐
       ├──► Agent 2 ──► Result 2 ──┼──► Vote/Consensus ──► Final
       └──► Agent 3 ──► Result 3 ──┘
```

**适用场景**: 代码审查、方案评估、风险分析（需要多视角）

#### Mode B: Sequential (子任务链)

```
Task ──► Agent A ──► Checkpoint 1 ──► Agent B ──► Checkpoint 2 ──► Final
              │                            │
              ▼                            ▼
         Human Review                 Human Review
         (可选)                        (可选)
```

**适用场景**: 需求分析→设计→实现→测试（有依赖关系的任务链）

#### Mode C: DAG/Hybrid (异步并行)

```
        ┌──► Agent A ──┐
Task ───┤              ├──► Agent D ──► Final
        └──► Agent B ──┘
              │
              └──► Agent C ──┘
```

**适用场景**: 独立子任务并行执行后合并（如多文件修改、多实验并行）

### 4.3 当前 Claude Code 支持度

| 模式 | 支持度 | 实现方式 |
|-----|-------|---------|
| Sequential | ✅ 完全支持 | Task tool 串行调用 |
| Parallel (独立) | ✅ 支持 | 多个 Task tool 并行 |
| Voting | ⚠️ 需手动 | 多次调用 + 人工比较 |
| DAG | ⚠️ 需手动 | Task + TaskOutput 组合 |

### 4.4 MCP Tool Architecture (MCP 工具架构)

**设计原则**: Multi-agent 调度系统作为 MCP (Model Context Protocol) tools 实现。

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP TOOL REGISTRY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Category: Agent Dispatch (代理调度)                            │
│  ├── dispatch_explorer    │ 启动探索型子代理                    │
│  ├── dispatch_executor    │ 启动执行型子代理                    │
│  ├── dispatch_reviewer    │ 启动审查型子代理                    │
│  └── dispatch_scribe      │ 启动记录型子代理                    │
│                                                                 │
│  Category: Document Intelligence (文档智能)                      │
│  ├── peek_document        │ 智能预览文档 (见 4.5)               │
│  ├── summarize_document   │ 生成文档摘要                        │
│  └── extract_insights     │ 提取关键洞见                        │
│                                                                 │
│  Category: Context Management (上下文管理)                       │
│  ├── load_global_context  │ 加载全局上下文                      │
│  ├── update_session_focus │ 更新会话焦点                        │
│  └── archive_to_history   │ 归档到历史                          │
│                                                                 │
│  Category: Coordination (协调)                                   │
│  ├── create_task_dag      │ 创建任务 DAG                        │
│  ├── checkpoint_task      │ 任务检查点                          │
│  └── merge_results        │ 合并多代理结果                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**MCP Tool 接口规范**:

```typescript
// 示例: dispatch_explorer tool
interface DispatchExplorerParams {
  task_description: string;      // 任务描述
  context_budget: number;        // 上下文预算 (tokens)
  files_to_read: string[];       // 允许读取的文件
  files_forbidden: string[];     // 禁止读取的文件
  output_format: "report" | "json" | "verdict";
  timeout_ms: number;            // 超时时间
}

interface DispatchExplorerResult {
  status: "success" | "timeout" | "error";
  verdict: string;               // 1-line 结论
  tldr: string[];                // 3-5 行摘要
  report_path: string;           // 完整报告路径
  insights_found: Insight[];     // 发现的洞见
  execution_time_ms: number;
}
```

### 4.5 Document Intelligence Tools (文档智能工具)

#### 4.5.1 Peek Tool (智能预览)

**问题**: 规范化文档无法从头尾几行获取洞见（changelog 不能反映文档内容）。

**解决**: `peek_document` 作为智能预览工具。

```
┌─────────────────────────────────────────────────────────────────┐
│                      PEEK TOOL DESIGN                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  输入:                                                          │
│  ├── document_path: string                                      │
│  ├── peek_mode: "structure" | "highlights" | "changes" | "full" │
│  └── context_budget: number (tokens)                            │
│                                                                 │
│  Peek Modes:                                                    │
│  ├── "structure"   │ 返回文档结构大纲 (headings + line counts) │
│  ├── "highlights"  │ 提取高亮/重要标记的内容                    │
│  ├── "changes"     │ 基于 git diff 或 metadata 提取变更         │
│  └── "full"        │ 使用长上下文子代理完整理解                 │
│                                                                 │
│  输出:                                                          │
│  ├── structure: DocumentOutline                                 │
│  ├── key_sections: string[]  (最相关的 N 个段落)                │
│  ├── suggested_read: string[] (建议深入阅读的部分)              │
│  └── confidence: number (0-1, 预览充分程度)                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**实现策略**:

```python
def peek_document(path: str, mode: str, budget: int) -> PeekResult:
    """智能预览文档"""

    if mode == "structure":
        # 快速: 只解析 markdown headings
        return extract_structure(path)

    elif mode == "highlights":
        # 中等: 提取 **bold**, `code`, > quotes
        return extract_highlights(path)

    elif mode == "changes":
        # 中等: 对比 git history 或 archive
        return extract_recent_changes(path)

    elif mode == "full":
        # 重量级: 启动长上下文子代理
        return dispatch_long_context_agent(path, budget)
```

#### 4.5.2 Long-Context Subagent (长上下文子代理)

**问题**: 某些文档必须完整阅读才能理解（如复杂的设计文档、实验报告）。

**解决**: 专用的长上下文子代理，作为 tool 调用。

```
┌─────────────────────────────────────────────────────────────────┐
│               LONG-CONTEXT SUBAGENT DESIGN                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  触发条件:                                                       │
│  ├── peek_document 返回 confidence < 0.5                        │
│  ├── 文档长度 > 500 lines                                       │
│  ├── 主代理显式请求 "need full understanding"                   │
│  └── 文档类型为 design_doc / investigation_report               │
│                                                                 │
│  工作模式:                                                       │
│  ├── 1. 接收完整文档 (不受主代理上下文限制)                      │
│  ├── 2. 完整阅读并理解                                          │
│  ├── 3. 生成结构化摘要                                          │
│  └── 4. 返回摘要给主代理 (压缩 10x-100x)                        │
│                                                                 │
│  输出格式:                                                       │
│  ├── executive_summary: string (3-5 sentences)                  │
│  ├── key_points: string[] (核心要点)                            │
│  ├── decisions_made: Decision[] (文档中的决策)                  │
│  ├── open_questions: string[] (未解决问题)                      │
│  ├── action_items: string[] (待办事项)                          │
│  └── cross_references: string[] (相关文档链接)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**调用示例**:

```python
# 主代理调用长上下文子代理
result = mcp_call("long_context_agent", {
    "document_path": "docs/2025121713_VIREC_INVESTIGATION_REPORT.md",
    "query": "What was the root cause and what was the solution?",
    "output_budget": 500,  # 返回最多 500 tokens
})

# result 包含压缩后的关键信息，主代理上下文不会爆炸
```

### 4.6 Agent-as-Tool Pattern (代理即工具模式)

**核心思想**: 子代理本身就是工具，其输入是任务描述，输出是结构化结果。

```
┌─────────────────────────────────────────────────────────────────┐
│                   AGENT-AS-TOOL PATTERN                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  主代理视角:                                                     │
│  ├── 子代理 = 黑盒工具                                          │
│  ├── 输入 = 任务描述 + 约束                                     │
│  ├── 输出 = 结构化结果 (verdict + summary + report_path)        │
│  └── 不关心子代理内部如何工作                                    │
│                                                                 │
│  子代理职责:                                                     │
│  ├── 完全自主执行任务                                           │
│  ├── 自行管理自己的上下文                                       │
│  ├── 产出符合规范的结构化输出                                    │
│  └── 将详细过程写入 report file (主代理可选择性读取)            │
│                                                                 │
│  关键约束:                                                       │
│  ├── 子代理不能直接与人类对话                                   │
│  ├── 子代理不能修改全局状态 (只能写入指定位置)                   │
│  └── 子代理必须在超时内完成                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Progressive Delivery Protocol (渐进式交付)

### 5.1 交付层级

```
Level 0: Verdict      │ 1 line    │ "PASS: 实验达标"
Level 1: TL;DR        │ 5 lines   │ 关键结论
Level 2: Key Sections │ 60 lines  │ 头/中/尾各20行
Level 3: Full Report  │ 全部      │ 完整细节
```

### 5.2 主 Agent 读取策略

```python
# 伪代码: 主 Agent 如何读取子 Agent 报告

def read_report(report_path):
    # Step 1: 读 verdict
    verdict = Read(report_path, limit=2)

    if verdict.contains("PASS") and confidence_high:
        return verdict  # 不需要更多

    # Step 2: 读 TL;DR
    tldr = Read(report_path, limit=10)

    if sufficient_for_decision:
        return tldr

    # Step 3: 读 key sections
    head = Read(report_path, offset=0, limit=20)
    mid = Read(report_path, offset=middle_offset, limit=20)
    tail = Read(report_path, offset=end_offset, limit=20)

    if sufficient_for_decision:
        return head + mid + tail

    # Step 4: 读全文
    return Read(report_path)
```

### 5.3 Human-in-the-Loop 决策点

| 决策点 | 触发条件 | 人类输入 |
|-------|---------|---------|
| 任务分解确认 | 复杂任务开始前 | 确认子任务划分 |
| Checkpoint 验收 | 子任务完成时 | 继续/修改/终止 |
| 冲突解决 | 多 Agent 结果不一致 | 选择/仲裁 |
| 交付深度选择 | 报告可用时 | 读多少/是否深入 |
| 战略方向确认 | DAG 需要修改时 | 确认新方向 |
| 资源超预算 | 任务耗时超预期 | 继续/放弃/调整范围 |

---

## 6. Integration with Existing System

### 6.1 CLAUDE.md 扩展

```markdown
# 新增 Section: Research Copilot Protocol

## Context Loading (会话开始时)
1. 读取 CLAUDE.md (本文件)
2. 检查 .claude/pending_questions.md
3. 检查 .claude/session_focus.md (如存在)
4. 读取最近 3 个 docs/ 文件的 TL;DR

## Knowledge Offload (会话中/结束时)
- 重要决策 → docs/decision_*.md
- 实验结果 → docs/experiment_*.md
- 会话摘要 → docs/session_*.md

## Sub-Agent Dispatch
- 探索任务 → Task(subagent_type="Explore")
- 执行任务 → Task(subagent_type="general-purpose")
- 报告位置 → .claude/reports/
```

### 6.2 文件结构变更

```
项目根目录/
├── CLAUDE.md                    # Global Context (已有，扩展)
├── .claude/                     # Session/Task Context (新增目录)
│   ├── pending_questions.md     # 跨会话待解决 (已有概念)
│   ├── session_focus.md         # 当前会话焦点 (新增)
│   └── reports/                 # Sub-Agent 报告 (新增)
│       └── task_YYYYMMDD_*.md
├── docs/                        # 归档文档 (已有)
│   ├── templates/               # 文档模板 (新增)
│   │   ├── report_template.md
│   │   ├── decision_template.md
│   │   └── experiment_template.md
│   ├── decision_*.md            # 决策记录
│   ├── experiment_*.md          # 实验记录
│   └── session_*.md             # 会话摘要
└── ...
```

---

## 7. Design Decisions (设计决策)

### 7.1 已确定决策

| 决策 | 选择 | 理由 |
|------|------|------|
| session_focus.md 谁来写 | **混合**: 人类写目标，Agent 补充细节 | 人类定义方向，Agent 提供执行细节 |
| 知识 offload 触发 | **混合**: 人类显式 + Agent 自动识别 | 重要决策人类触发，常规信息 Agent 识别 |
| Sub-Agent 报告存放 | **混合**: 先临时，重要升级永久 | `.claude/reports/` 临时 → `docs/` 永久 |
| Human-in-the-loop 粒度 | **关键节点确认** | 平衡效率与控制，战略决策才介入 |

### 7.2 实现优先级

| Priority | 功能 | 状态 |
|----------|------|------|
| P0 | 完善 CLAUDE.md Context Loading 协议 | 待实现 |
| P1 | 创建文档模板 (report/decision/experiment) | 待实现 |
| P1 | 实现 pending_questions.md 机制 | 已有雏形 |
| P2 | 实现 session_focus.md 机制 | 待实现 |
| P2 | 实现渐进式读取策略 | 待实现 |
| P3 | 实现 Sub-Agent 报告协议 | 待实现 |

### 7.3 待讨论问题

1. **熵代理权重**: $\lambda_Q, \lambda_D, \lambda_{doc}$ 的具体值需要项目运行后校准
2. **β(t) 调节**: 如何让用户方便地调节探索-利用权衡？
3. **文档浓缩阈值**: 300/500/800 lines 是否合适？

---

## 8. Next Steps

1. [ ] 填写 Section 7 的 Open Questions
2. [ ] 确定 MVP (Minimum Viable Protocol)
3. [ ] 创建文档模板文件
4. [ ] 更新 CLAUDE.md 加入新协议
5. [ ] 试运行并迭代

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-17 | Initial draft |
| 2025-12-17 | v0.5: Remove Least Action analogy, resolve TBDs, add design decisions |
| 2025-12-17 | v0.6: Fix entropy notation: H(s) → H(G\|s), add I(s;G) mutual information |
| 2025-12-17 | v0.7: **Bayesian framework**: G→θ, s→ω, update all notation |
| 2025-12-17 | v0.8: Add Symbol Table at document beginning |

