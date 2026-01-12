# Research Copilot: Mathematical Manifesto

> 一个基于贝叶斯推断和信息论的智能协作系统框架。

**Document Metadata**
- Version: 0.5.0
- Created: 2025-12-17T17:54
- Last Modified: 2025-12-17T20:30
- Update Count: 4

---

## Symbol Table (符号速查表)

| Symbol | Name | Meaning |
|--------|------|---------|
| $\Theta$ | 假设空间 | 所有可能的研究路径/结论 |
| $\theta \in \Theta$ | 假设 | 一个具体的研究假设/方向 |
| $\theta^*$ | 真实假设 | 实际正确的那个（未知） |
| $\omega_t$ | 观测 | 第 t 步获得的信息（实验结果、讨论、发现） |
| $\omega_{<t}$ | 观测历史 | 截至 t-1 的所有观测 |
| $\omega_{\leq t}$ | 观测历史 | 截至 t 的所有观测 |
| $a_t$ | 动作 | 第 t 步的决策（做什么实验、探索什么方向） |
| $P(\theta)$ | 先验 | 初始对假设的信念分布 |
| $P(\theta \mid \omega_{\leq t})$ | 后验 | 给定观测历史，对假设的信念分布 |
| $H(\theta \mid \omega)$ | 后验熵 | 给定观测后对假设的剩余不确定性 |
| $I(\theta; \omega)$ | 互信息 | 观测提供的关于假设的信息量 |
| $\Delta^+$ | 信息增益 | $I(\theta; \omega_t \mid \omega_{<t})$ 新观测带来的信息 |
| $\Delta^-$ | 不确定性注入 | 新问题/外部变化带来的不确定性 |
| $V_H(\theta)$ | 人类价值函数 | 定义哪些假设值得关心 |
| $\Theta_{\text{relevant}}$ | 相关假设空间 | $\{\theta : V_H(\theta) > \tau\}$ |
| $P(a \mid \omega)$ | 动作分布 | 来自对最优动作 $a^*$ 的信念不确定性 |
| $L_{\text{ctx}}$ | 上下文限制 | 单次可处理的信息量上限 |

---

# Part A: Pure Theory (纯理论层)

## A.1 Objective Function (目标函数)

### A.1.1 Core Formulation

系统的目标是**最小化对假设的后验不确定性**同时**最大化人类认可的价值**：

$$
\mathcal{J}(\pi) = \underbrace{\mathbb{E}\left[ \sum_t H(\theta \mid \omega_{\leq t}) \right]}_{\text{对假设的后验不确定性}} - \beta \cdot \underbrace{\mathbb{E}\left[ \sum_t V_H(\theta) \right]}_{\text{假设的人类价值}}
$$

$$
\pi^* = \arg\min_\pi \mathcal{J}(\pi)
$$

**等价形式**: 最大化互信息 $I(\theta; \omega_{1:T})$

### A.1.2 Entropy vs Mutual Information (熵与互信息的区分)

**关键概念澄清**:

| 概念 | 符号 | 含义 | 性质 |
|------|------|------|------|
| 先验熵 | $H(\theta)$ | 假设空间的固有不确定性 | **常数**，反映初始无知程度 |
| 后验熵 | $H(\theta \mid \omega)$ | 给定观测后，对假设的剩余不确定性 | **我们要最小化** |
| 互信息 | $I(\theta; \omega)$ | 观测提供的关于假设的信息量 | **我们要最大化** |

**关系**:
$$
I(\theta; \omega) = H(\theta) - H(\theta \mid \omega)
$$

由于 $H(\theta)$ 是常数，**最小化 $H(\theta|\omega)$ 等价于最大化 $I(\theta;\omega)$**。

### A.1.3 Why This Form?

| 项 | 为什么需要 |
|---|-----------|
| $\sum_t H(\theta \mid \omega_{\leq t})$ | 研究是减少对假设不确定性的过程，累积后验熵是进度指标 |
| $V_H(\theta)$ | 只关心人类认为有价值的假设空间 |
| $\beta$ | 权衡探索（允许临时增加不确定性）与收敛 |

### A.1.4 Adversarial Extension (对抗性扩展)

现实中，环境会持续注入新的不确定性（新问题、新发现、外部变化）：

$$
\min_{\pi} \max_{\Delta^-} \mathcal{J}(\pi) + \sum_t \Delta^-(t)
$$

这是一个 **鲁棒优化** 问题：在最坏情况的不确定性注入下，仍要找到足够好的策略。

---

## A.2 Symbol Definitions (符号定义)

### A.2.1 Spaces (空间)

| Symbol | Name | Description |
|--------|------|-------------|
| $\mathcal{T}$ | Time Index | $\mathcal{T} = \{0, 1, 2, \ldots\}$ 或 $[0, T]$ |
| $\Theta$ | Hypothesis Space | 所有可能的研究路径/结论（**核心推断对象**）|
| $\Omega$ | Observation Space | 所有可能观测的集合（实验结果、讨论、发现）|
| $\mathcal{A}$ | Action Space | 所有可能动作的集合（做什么实验、探索什么方向）|
| $\mathcal{I}$ | Information Space | 所有信息单元的集合 |

### A.2.2 Core Variables (核心变量)

| Symbol | Type | Description |
|--------|------|-------------|
| $\theta$ | $\theta \in \Theta$ | 待推断的假设（实际正确的 $\theta^*$ 未知）|
| $\omega_t$ | $\omega_t \in \Omega$ | 时刻 $t$ 获得的观测 |
| $\omega_{<t}$ | $\omega_{<t} \subset \Omega$ | 截至 $t-1$ 的所有观测历史 |
| $\omega_{\leq t}$ | $\omega_{\leq t} \subset \Omega$ | 截至 $t$ 的所有观测历史 |
| $a_t$ | $a_t \in \mathcal{A}$ | 时刻 $t$ 的动作/决策 |
| $I_t$ | $I_t \subseteq \mathcal{I}$ | 时刻 $t$ 累积的信息集合 |

### A.2.3 Functions & Operators (函数与算子)

| Symbol | Signature | Description |
|--------|-----------|-------------|
| $H(\theta)$ | $\to \mathbb{R}^+$ | 先验熵：假设空间的初始不确定性 |
| $H(\theta \mid \omega)$ | $\to \mathbb{R}^+$ | 后验熵：给定观测后对假设的剩余不确定性 |
| $I(\theta; \omega)$ | $\to \mathbb{R}^+$ | 互信息：观测带来的信息增益 |
| $V_H(\theta)$ | $\Theta \to \mathbb{R}$ | 人类价值函数：定义哪些假设值得关心 |
| $\mathcal{C}_k$ | $\mathcal{I}^{(k-1)} \to \mathcal{I}^{(k)}$ | 第 $k$ 层压缩/抽象算子 |
| $\pi$ | $P(\theta \mid \omega) \to \mathcal{A}$ | 策略函数：从信念到动作 |

### A.2.4 Distributions (分布)

| Symbol | Description |
|--------|-------------|
| $P(\theta)$ | 假设的先验分布 (初始信念) |
| $P(\theta \mid \omega_{\leq t})$ | 给定观测后的后验分布 (更新信念) |
| $P(\omega_t \mid \theta, a_t)$ | 似然函数：给定假设和动作，观测的概率 |
| $P(a_t \mid \omega_{<t})$ | 动作分布：**来自对最优动作 $a^*$ 的信念不确定性** |

---

## A.3 Dynamics (动力学)

### A.3.1 Bayesian Update (贝叶斯更新) — 核心动力学

$$
P(\theta \mid \omega_{\leq t}) = \frac{P(\omega_t \mid \theta, a_t) \cdot P(\theta \mid \omega_{<t})}{P(\omega_t \mid \omega_{<t}, a_t)}
$$

**信念演化**:
- 初始: $P(\theta)$ 宽分布 (高熵，对假设高度不确定)
- 迭代: 每次观测 $\omega_t$ 收窄后验分布
- 终止: $P(\theta \mid \omega_{1:T})$ 集中于正确假设 (低熵)

### A.3.2 Information Gain (信息增益)

每次观测的信息增益为：

$$
\Delta^+_t = H(\theta \mid \omega_{<t}) - H(\theta \mid \omega_{\leq t}) = I(\theta; \omega_t \mid \omega_{<t})
$$

这是 $\omega_t$ 关于 $\theta$ 的**条件互信息**，即给定已有观测，新观测带来的额外信息。

### A.3.3 Posterior Entropy Dynamics (后验熵动力学)

#### Ideal vs Realistic (理想 vs 现实)

**理想情况** (单调信息增益):
$$
H(\theta \mid \omega_{\leq t+1}) < H(\theta \mid \omega_{\leq t}) \quad \forall t
$$

**现实情况** (含不确定性注入):
$$
H(\theta \mid \omega_{\leq t+1}) = H(\theta \mid \omega_{\leq t}) - \Delta^+(a_t) + \Delta^-(t)
$$

| Term | Description | Interpretation |
|------|-------------|----------------|
| $\Delta^+ = I(\theta; \omega_t \mid \omega_{<t})$ | 新观测带来的**信息增益** | 条件互信息 |
| $\Delta^- = \Delta H_{\text{newQ}} + \Delta H_{\text{env}}$ | 外部注入的不确定性 | 新问题、环境变化 |

#### Long-term Goal (长期目标)

$$
\mathbb{E}\left[ \sum_{t=0}^{T-1} \Delta^+(t) \right] > \mathbb{E}\left[ \sum_{t=0}^{T-1} \Delta^-(t) \right]
$$

**Goal**: 累积信息增益 > 累积不确定性注入 (净信息增益为正)

---

## A.3.4 New Questions Modeling (新问题建模)

### Definition

新问题 $q \in \mathcal{Q}_{\text{new}}$ 是系统演化过程中产生的子问题，贡献 $\Delta^-$。

### Attributes

| Attribute | Symbol | Description |
|-----------|--------|-------------|
| 熵贡献 | $\Delta^-(q)$ | 问题带来的不确定性注入 |
| 阻塞性 | $\text{block}(q) \in \{0, 1\}$ | 是否在关键路径上 |
| 期望价值 | $\mathbb{E}[V_H(q)]$ | 解决后对人类价值的贡献 |
| 信息增益 | $I(q; \theta)$ | 对主假设 $\theta$ 的潜在信息量 |
| 解决代价 | $\text{cost}(q)$ | 时间、资源、注意力消耗 |

### Taxonomy (分类学)

$$
\mathcal{Q}_{\text{new}} = \mathcal{Q}_A \cup \mathcal{Q}_B \cup \mathcal{Q}_C
$$

| Type | Condition | Strategy |
|------|-----------|----------|
| $\mathcal{Q}_A$ (阻塞型) | $\text{block}(q) = 1$ | 必须解决 |
| $\mathcal{Q}_B$ (机会型) | $\text{block}(q) = 0 \land I(q; \theta) \geq \tau$ | 按 $I(q;\theta) \cdot V_H(q)$ 排序 |
| $\mathcal{Q}_C$ (干扰型) | $\text{block}(q) = 0 \land I(q; \theta) < \tau$ | 忽略或延迟 |

### New Question Paradox (新问题悖论)

新问题是"捣乱分子"，但也可能是高价值信息的来源:

$$
\underbrace{\Delta^-(q)}_{\text{增熵代价}} \quad \text{vs} \quad \underbrace{I(q; \theta) \cdot V_H(q)}_{\text{信息价值}}
$$

---

## A.3.5 Exploration-Exploitation Trade-off (探索-利用权衡)

### Problem Formulation

对于机会型问题 $q \in \mathcal{Q}_B$，需要决定是否投入资源:

$$
\text{decide}(q) = \begin{cases}
\text{explore} & \text{if } \text{score}(q) > \theta \\
\text{defer} & \text{otherwise}
\end{cases}
$$

### Scoring Function

**信息导向评分**:
$$
\text{score}(q) = \underbrace{\mathbb{E}[V(q)]}_{\text{exploitation}} + \lambda \cdot \underbrace{I(q; G)}_{\text{exploration}} - \mu \cdot \underbrace{\text{cost}(q)}_{\text{resource}}
$$

**UCB 风格评分** (考虑不确定性):
$$
\text{score}(q) = \mathbb{E}[V(q)] + c \cdot \sqrt{\frac{\ln N}{\text{visits}(q) + 1}}
$$

其中 $N$ 是总决策次数，$\text{visits}(q)$ 是已探索次数。

### Regret Minimization View (后悔最小化视角)

探索的价值在于减少未来的后悔:

$$
\text{Regret}_T = \sum_{t=1}^{T} \left[ V^*(s_t) - V(s_t, a_t) \right]
$$

最优策略平衡当前收益和信息获取:

$$
\pi^* = \arg\min_\pi \mathbb{E}[\text{Regret}_T]
$$

### Exploration Budget (探索预算)

探索有成本，需要预算约束:

$$
\sum_{q \in \mathcal{Q}_B^{\text{explored}}} \text{cost}(q) \leq B_{\text{explore}}
$$

$B_{\text{explore}}$ 由项目阶段和 $\beta(t)$ 决定:
- 早期: $B_{\text{explore}}$ 大 (鼓励探索)
- 后期: $B_{\text{explore}}$ 小 (聚焦交付)

---

## A.3.6 Action Uncertainty (动作的不确定性)

### Core Principle

**核心洞见**: 一切不确定性都是信念不确定性。动作 $a$ 的"随机性"不是物理随机，而是决策者对"最优动作是什么"的信念不确定性。

$$
P(a_t \mid \omega_{<t}) = P(a_t \text{ is optimal} \mid \omega_{<t}, \text{决策者的知识})
$$

### Why Actions Appear Random

```
为什么动作 a 看起来"随机"？

不是因为: 存在物理随机过程
而是因为: 决策者不确定哪个 a 最优

Human 选 a: 不确定哪个方向更好 → P(a*|knowledge) 是 spread out 的
Agent 选 a: 不确定哪个动作信息增益最大 → P(a*|belief) 是 spread out 的

本质相同: a 的不确定性 = 决策者对 "a* 是什么" 的信念不确定性
```

### Belief Evolution

**随着信息积累**:

$$
\text{观测积累} \Rightarrow \begin{cases}
P(\theta \mid \omega) \text{ 越来越集中} & \text{对假设更确定} \\
P(a^* \mid \omega) \text{ 越来越集中} & \text{对最优动作更确定}
\end{cases}
$$

**结果**: 探索减少，利用增加 — 这不是策略设计，而是贝叶斯更新的自然结果。

### Implications for System Design

| Aspect | Implication |
|--------|-------------|
| 探索策略 | 不需要显式 ε-greedy，信念不确定性自然导致探索 |
| 收敛判断 | 当 $P(a^* \mid \omega)$ 集中时，系统自然收敛 |
| Human-Agent 一致性 | Human 和 Agent 的动作不确定性来源相同 |

---

## A.4 Objective Instantiation (目标实例化)

### A.4.1 Per-Step Objective

单步目标函数：

$$
\mathcal{L}_t = \mathbb{E}[H(\theta \mid \omega_{\leq t})] - \beta(t) \cdot V_H(\theta)
$$

| Term | Interpretation |
|------|----------------|
| $\mathbb{E}[H(\theta \mid \omega_{\leq t})]$ | 后验熵：对假设的剩余不确定性（要最小化）|
| $V_H(\theta)$ | 人类价值：假设的重要性权重 |
| $\beta(t)$ | 权衡参数（时变，随项目阶段调整）|

总目标: $\mathcal{J} = \sum_t \mathcal{L}_t$

**等价形式** (最大化互信息):
$$
\max_\pi \mathbb{E}\left[ \sum_t I(\theta; \omega_{\leq t}) \right] + \beta \cdot \mathbb{E}\left[ \sum_t V_H(\theta) \right]
$$

### A.4.2 Beta Dynamics (权衡参数动态)

$\beta(t)$ 由 **Agents** 和 **Human** 共同决定:

$$
\beta(t) = \alpha_A \cdot \beta_A(t) + \alpha_H \cdot \beta_H(t), \quad \alpha_A + \alpha_H = 1
$$

典型演化:
- 项目初期: $\beta$ 小 → 重视确定性，保守探索
- 项目中期: $\beta$ 适中 → 平衡探索与利用
- 临近 deadline: $\beta$ 大 → 重视价值/交付

### A.4.3 Optimal Policy

**目标**: 找到最优策略 $\pi^*$ 使总目标最小:

$$
\pi^* = \arg\min_{\pi} \mathbb{E}\left[ \sum_{t=0}^{T} \mathcal{L}_t \right] = \arg\min_\pi \mathcal{J}(\pi)
$$

---

## A.5 Information Hierarchy & Noise (信息层级与噪声)

### A.5.1 Abstraction Layers

原始信息经过多层抽象:

$$
I^{(0)} \xrightarrow{\mathcal{C}_1} I^{(1)} \xrightarrow{\mathcal{C}_2} I^{(2)} \xrightarrow{\mathcal{C}_3} \cdots \xrightarrow{\mathcal{C}_K} I^{(K)}
$$

每层抽象引入噪声:
$$
I^{(k)} = \mathcal{C}_k(I^{(k-1)}) + \varepsilon_k
$$

### A.5.2 Noise Accumulation

累积噪声方差:
$$
\text{Var}(I^{(K)}) = \sum_{k=1}^{K} \text{Var}(\varepsilon_k)
$$

**问题**: 层次越深，噪声越大，决策质量下降。

### A.5.3 Denoising Strategy

**聚合去噪**: Bypass 中间层，从原始信息重新抽象:

$$
I^{(K)}_{\text{denoised}} = \mathcal{C}_{\text{direct}}(I^{(0)})
$$

其中 $\mathcal{C}_{\text{direct}}: \mathcal{I}^{(0)} \to \mathcal{I}^{(K)}$ 是直接压缩算子。

**代价**: 需要更多计算/上下文资源。

---

## A.6 Information Value (信息价值)

### A.6.1 Value Definition

观测 $\omega$ 的信息价值由两个因子决定:

$$
\text{IV}(\omega) = I(\omega; \theta) \cdot V_H(\theta)
$$

| Factor | Description |
|--------|-------------|
| $I(\omega; \theta)$ | $\omega$ 与假设 $\theta$ 的互信息（减熵贡献）|
| $V_H(\theta)$ | 人类对假设 $\theta$ 的价值判断（哪些假设值得关心）|

### A.6.2 V_H 的角色

$V_H$ 定义"哪些假设值得关心"：

$$
\Theta_{\text{relevant}} = \{\theta : V_H(\theta) > \tau\}
$$

我们只关心 $H(\theta \mid \omega)$ 在 $\Theta_{\text{relevant}}$ 上的值。

### A.6.3 High-Value Information

高价值信息满足:
$$
\text{IV}(\omega) > \tau_{\text{threshold}}
$$

特征:
- 对假设信息量大: $I(\omega; \theta)$ 高
- 假设有人类价值: $V_H(\theta)$ 高
- 使用后减熵效果显著

---

## A.7 Two-Entity System (双实体系统)

### A.7.1 Entities

系统由两类实体组成:

$$
\mathcal{E} = \{\mathcal{E}_A, \mathcal{E}_H\}
$$

| Entity | Symbol | Properties |
|--------|--------|------------|
| Multi-Agent System | $\mathcal{E}_A$ | 高吞吐、可并行、易出错 |
| Human | $\mathcal{E}_H$ | 低吞吐、价值判断准、更新慢 |

### A.7.2 Human Characteristics

**价值函数特性**:
- 初始训练好: $V_H^{(0)}$ 质量高
- 更新慢 (进化惯性): $\|V_H^{(t+1)} - V_H^{(t)}\| < \epsilon_H$
- 版本化: $V_H^{(0)}, V_H^{(1)}, \ldots$

**人类学习**:
$$
M_H^{(t+1)} = M_H^{(t)} + \eta_H \cdot \sum_{\omega: \text{IV}(\omega) > \tau} \nabla_M \log P(\omega \mid M_H^{(t)})
$$

其中 $\eta_H$ 小 (学习率低)。

### A.7.3 Role Division

| Role | Agent ($\mathcal{E}_A$) | Human ($\mathcal{E}_H$) |
|------|-------------------------|-------------------------|
| 信息收集 | 主要 | 偶尔 |
| 抽象/压缩 | 主要 | 关键抽象、去噪 |
| 决策执行 | 常规决策 | 战略决策 |
| 价值判断 | 参考 $V_H$ | 定义 $V_H$ |

---

## A.8 Constrained vs Ideal Scenarios (受限 vs 理想场景)

### A.8.1 Ideal Scenario (理想场景)

**假设**:
- 完全可观测: $\forall I \in I_t$, 可访问
- 无限资源: 上下文长度 $\to \infty$, 时间 $\to \infty$
- 无噪声: $\varepsilon_t = 0$

**动力学**:
$$
s_{t+1} = f(s_t, a_t, \omega_{t+1})
$$

$$
P(\theta \mid \omega_{1:t}) = \text{exact posterior}
$$

### A.8.2 Constrained Scenario (受限场景)

**约束**:

| Constraint | Symbol | Description |
|------------|--------|-------------|
| Context Limit | $L_{\text{ctx}}$ | 单次可处理的信息量上限 |
| Time Budget | $T_{\text{budget}}$ | 可用时间上限 |
| Observation Limit | $\Omega_{\text{access}} \subset \Omega$ | 可访问的观测子集 |
| Noise | $\varepsilon_t \neq 0$ | 不可避免的噪声 |

**受限动力学**:
$$
s_{t+1} = f(s_t, a_t, \tilde{\omega}_{t+1}) + \varepsilon_t
$$

其中 $\tilde{\omega}_{t+1} \in \Omega_{\text{access}}$ 是可访问的观测子集。

**近似后验**:
$$
Q(\theta \mid \tilde{\omega}_{1:t}) \approx P(\theta \mid \omega_{1:t})
$$

### A.8.3 Constrained Optimization

在受限场景下，目标变为:

$$
\pi^* = \arg\min_{\pi} \mathbb{E}\left[ \sum_{t=0}^{T} F_t \right]
$$

$$
\text{s.t.} \quad |I_{\text{context}}(t)| \leq L_{\text{ctx}}, \quad t \leq T_{\text{budget}}
$$

**策略**: 在约束下做最优信息选择:
$$
\tilde{\omega}_t = \arg\max_{\omega \in \Omega_{\text{access}}, |\omega| \leq L_{\text{ctx}}} \text{IV}(\omega)
$$

---

## A.9 System Invariants (系统不变量)

### A.9.1 Formal Invariants

$$
\boxed{
\begin{aligned}
\textbf{I-1: } & \omega_{\leq t} \subseteq \omega_{\leq t+1} & \text{(观测历史单调积累)} \\
\textbf{I-2: } & \mathbb{E}[H(\theta \mid \omega_{\leq T})] < H(\theta \mid \omega_0) & \text{(后验熵最终减少)} \\
\textbf{I-3: } & \forall d, \exists \text{trace}(d) \to \omega_{\text{raw}} & \text{(决策可追溯到原始观测)} \\
\textbf{I-4: } & d \in \mathcal{D}_{\text{strategic}} \Rightarrow V_H(d) > 0 & \text{(战略决策需人类认可)} \\
\textbf{I-5: } & |\omega_{\text{active}}| \leq L_{\text{ctx}} & \text{(活跃上下文有界)}
\end{aligned}
}
$$

### A.9.2 Invariant Preservation

系统设计必须保证在任何操作序列下，I-1 到 I-5 均成立。

---

## A.10 Theoretical Summary (理论总结)

### A.10.1 The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     INITIAL STATE                      FINAL STATE              │
│     H(θ|ω₀) = High                     H(θ|ω_T) = Low           │
│     I(θ;ω₀) = Low                      I(θ;ω_T) = High          │
│     P(θ) = Broad                       P(θ|ω_{1:T}) = Sharp     │
│     P(a*|ω₀) = Spread                  P(a*|ω_T) = Concentrated │
│                                                                 │
│         │                                   ▲                   │
│         │      Optimal Policy π*            │                   │
│         │      min J(π)                     │                   │
│         │                                   │                   │
│         └──────────────→ γ* ────────────────┘                   │
│                                                                 │
│     Driven by:                                                  │
│     ├── Objective: min Σ[H(θ|ω)] - β·Σ[V_H(θ)]                │
│     │              ≡ max Σ[I(θ;ω)] + β·Σ[V_H(θ)]              │
│     ├── Bayesian Update: P(θ|ω) ∝ P(ω|θ,a)P(θ)                │
│     ├── Value Function: V_H(θ) defines Θ_relevant              │
│     ├── Action Uncertainty: P(a|ω) from belief uncertainty     │
│     └── Constraints: L_ctx, Ω_access                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### A.10.2 Key Equations Summary

| Concept | Equation |
|---------|----------|
| **Objective** | $\mathcal{J}(\pi) = \mathbb{E}[\sum_t H(\theta \mid \omega_{\leq t})] - \beta \cdot \mathbb{E}[\sum_t V_H(\theta)]$ |
| **Equivalent** | $\max_\pi \mathbb{E}[\sum_t I(\theta; \omega_{\leq t})] + \beta \cdot \mathbb{E}[\sum_t V_H(\theta)]$ |
| Robust Extension | $\min_\pi \max_{\Delta^-} \mathcal{J}(\pi) + \sum_t \Delta^-(t)$ |
| Posterior Entropy Dynamics | $H(\theta \mid \omega_{\leq t+1}) = H(\theta \mid \omega_{\leq t}) - \Delta^+ + \Delta^-$ |
| **Information Gain** | $\Delta^+ = I(\theta; \omega_t \mid \omega_{<t})$ (条件互信息) |
| Per-Step Loss | $\mathcal{L}_t = \mathbb{E}[H(\theta \mid \omega_{\leq t})] - \beta(t) \cdot V_H(\theta)$ |
| **Bayesian Update** | $P(\theta \mid \omega_{\leq t}) \propto P(\omega_t \mid \theta, a_t) P(\theta \mid \omega_{<t})$ |
| **Information Value** | $\text{IV}(\omega) = I(\omega; \theta) \cdot V_H(\theta)$ |
| **Action Uncertainty** | $P(a \mid \omega) = P(a \text{ is optimal} \mid \omega, \text{belief})$ |
| Constrained Opt | $\min \mathcal{J} \quad \text{s.t.} \quad |\omega_{\text{active}}| \leq L_{\text{ctx}}$ |

---

# Part B: Symbol-to-Design Mapping (符号到设计的映射)

## B.1 Mapping Table

| Theory Symbol | System Design Component | Location |
|---------------|------------------------|----------|
| $\Theta$ | Hypothesis Space | 所有可能的研究路径/结论 |
| $\theta$ | Hypothesis | 一个具体的研究假设/方向 |
| $\theta^*$ | True Hypothesis | 实际正确的那个（未知）|
| $\Omega$ | Observation Space | 实验结果、讨论记录、代码行为 |
| $\omega_t$ | Single Observation | 一条实验结果、一个洞见、一次讨论 |
| $\omega_{<t}$ | Observation History | `docs/.archive/`, 历史日志 |
| $\mathcal{A}$ | Action Space | 任务执行、决策、文档操作 |
| $a_t$ | Action | 运行实验、做出决策、写入文档 |
| $P(\theta \mid \omega)$ | Posterior | Decision confidence, 当前信念 |
| $H(\theta \mid \omega)$ | Posterior Entropy | 对假设的剩余不确定性 (Proxy: Open Questions) |
| $I(\theta; \omega)$ | Mutual Information | 观测与假设的相关性 (Proxy: Resolved Questions) |
| $V_H(\theta)$ | Value Function | Human preference: 哪些假设值得关心 |
| $P(a \mid \omega)$ | Action Distribution | 对最优动作的信念（来自信念不确定性）|
| $\beta(t)$ | Trade-off Parameter | 项目阶段参数 |
| $\mathcal{C}_k$ | Compression | Document Condensation Protocol |
| $L_{\text{ctx}}$ | Context Limit | Agent 上下文窗口大小 |
| $\mathcal{E}_A$ | Agent System | Multi-Agent Architecture (Section 4) |
| $\mathcal{E}_H$ | Human | Human-in-the-Loop protocols |

## B.2 Invariant Implementation

| Invariant | Implementation |
|-----------|----------------|
| I-1 (观测单调积累) | Raw observation 永久存档于 `.archive/` |
| I-2 (后验熵减少) | 追踪 Open Questions 下降 / Resolved Questions 上升 |
| I-3 (决策可追溯) | 每个决策文档链接到原始观测 |
| I-4 (人类认可) | 战略决策需 Human 确认 |
| I-5 (上下文有界) | Progressive Delivery Protocol |

## B.3 Scenario Implementation

| Scenario | Implementation |
|----------|----------------|
| Ideal | Long-context subagent 完整阅读 |
| Constrained (ctx) | Peek tool + Progressive Delivery |
| Constrained (time) | Priority Queue + 预算分配 |
| Constrained (access) | 文档索引 + 按需加载 |

---

# Part C: Posterior Entropy Proxy Design (后验熵代理设计)

> 这是将理论 grounding 到可操作指标的关键部分。

## C.1 Design Principles

**核心问题**: $H(\theta|\omega)$ (对假设的后验不确定性) 是一个抽象概念，需要具体的、可测量的代理指标。

**等价目标**: 最小化 $H(\theta|\omega)$ ≡ 最大化 $I(\theta;\omega)$ (观测与假设的互信息)

**设计约束**:
1. **可测量**: 必须能从系统观测直接计算
2. **单调性**: 当对假设更确定时，代理应减少
3. **可操作**: 能够指导策略选择
4. **与 V_H 兼容**: 代理减少但 V_H 不增时，应能检测到

## C.2 Candidate Proxies (候选代理指标)

### C.2.1 Question-Based Proxy (问题为基础)

$$
H_Q(s) = \sum_{q \in Q_{\text{open}}} w(q) \cdot \text{uncertainty}(q)
$$

| Component | Measurement |
|-----------|-------------|
| $Q_{\text{open}}$ | 未解决问题列表 (从 pending_questions.md 提取) |
| $w(q)$ | 问题权重 (P0=3, P1=2, P2=1) |
| $\text{uncertainty}(q)$ | 1.0 (未开始), 0.5 (探索中), 0.0 (已解决) |

**优点**: 直接对应研究进度
**缺点**: 需要维护问题列表

### C.2.2 Decision-Based Proxy (决策为基础)

$$
H_D(s) = |D_{\text{pending}}| + \alpha \cdot |D_{\text{blocked}}|
$$

| Component | Measurement |
|-----------|-------------|
| $D_{\text{pending}}$ | 待做决策数量 |
| $D_{\text{blocked}}$ | 阻塞中决策数量 |
| $\alpha$ | 阻塞惩罚系数 (建议 2.0) |

**优点**: 决策是里程碑，减少代表进展
**缺点**: 不捕获探索阶段

### C.2.3 Document-Based Proxy (文档为基础)

$$
H_{\text{doc}}(s) = \frac{\text{TBD\_count}}{\text{total\_statements}} + \gamma \cdot \text{uncertainty\_density}
$$

| Component | Measurement |
|-----------|-------------|
| TBD_count | 文档中 "[TBD]", "待定", "?" 的数量 |
| total_statements | 文档中的陈述句数量 |
| uncertainty_density | 模糊词汇密度 ("可能", "也许", "不确定") |

**优点**: 自动化程度高
**缺点**: 可能被人为操纵

### C.2.4 Composite Proxy (组合代理)

**推荐方案**: 加权组合

$$
\hat{H}(\theta|\omega) = \lambda_Q \cdot H_Q + \lambda_D \cdot H_D + \lambda_{\text{doc}} \cdot H_{\text{doc}}
$$

其中 $\hat{H}(\theta|\omega)$ 是后验熵的代理估计。

初始权重建议: $\lambda_Q = 0.5, \lambda_D = 0.3, \lambda_{\text{doc}} = 0.2$

## C.3 Delta Measurement (Δ⁺/Δ⁻ 测量)

### C.3.1 Δ⁺ = I(θ; ω_t | ω_{<t}) (信息增益)

| Action Type | Δ⁺ Measurement |
|-------------|----------------|
| 解决 P0 问题 | 3.0 |
| 解决 P1 问题 | 2.0 |
| 解决 P2 问题 | 1.0 |
| 做出关键决策 | 2.0 |
| 完成里程碑 | 5.0 |
| 消除 [TBD] | 0.5 |

### C.3.2 Δ⁻ (不确定性注入)

| Event Type | Δ⁻ Measurement |
|------------|----------------|
| 新增 P0 问题 | 3.0 |
| 新增 P1 问题 | 2.0 |
| 发现需推翻旧结论 | 4.0 |
| 外部需求变更 | 3.0 |
| 实验结果与预期不符 | 2.0 |

### C.3.3 Progress Tracking

$$
\text{NetProgress}(t) = \sum_{\tau=0}^{t} \Delta^+(\tau) - \sum_{\tau=0}^{t} \Delta^-(\tau)
$$

**健康指标**: NetProgress > 0 且持续增长

## C.4 Implementation Sketch

```python
class EntropyProxy:
    """熵代理计算器"""

    def __init__(self, weights: dict = None):
        self.weights = weights or {
            'question': 0.5,
            'decision': 0.3,
            'document': 0.2
        }

    def compute(self, state: SystemState) -> float:
        """计算当前熵代理值"""
        h_q = self._question_entropy(state.pending_questions)
        h_d = self._decision_entropy(state.pending_decisions)
        h_doc = self._document_entropy(state.documents)

        return (self.weights['question'] * h_q +
                self.weights['decision'] * h_d +
                self.weights['document'] * h_doc)

    def delta_plus(self, action: Action) -> float:
        """计算动作的减熵量"""
        return DELTA_PLUS_TABLE.get(action.type, 0.0)

    def delta_minus(self, event: Event) -> float:
        """计算事件的增熵量"""
        return DELTA_MINUS_TABLE.get(event.type, 0.0)
```

---

# Part D: Open Questions (待补充)

## D.1 Theoretical Questions

1. **$\beta(t)$ 的动态方程**: 如何形式化 Agent-Human 共同决定？
2. **噪声模型**: $\varepsilon_t$ 的分布假设？Gaussian 是否足够？
3. **收敛性**: 系统是否保证收敛到低熵状态？
4. **Proxy 校准**: 如何验证 proxy 确实反映真实进度？

## D.2 Implementation Questions

1. **价值函数版本化**: 如何存储和管理 $V_H^{(t)}$？
2. **去噪时机**: 何时触发聚合去噪？
3. **$\beta$ 调节界面**: 如何让用户调节？
4. **Proxy 权重调优**: 如何根据项目特点调整 $\lambda$ 值？

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-17 | Initial mathematical framework |
| 2025-12-17 | v0.2: Remove Least Action/Free Energy physics analogies, add Entropy Proxy Design (Part C) |
| 2025-12-17 | v0.3: Fix entropy notation: H(s) → H(G\|s) conditional entropy, add mutual information I(s;G) |
| 2025-12-17 | v0.4: **Bayesian framework**: G→θ, s→ω, add A.3.6 Action Uncertainty from belief |
| 2025-12-17 | v0.5: Add Symbol Table at document beginning |

