# Research Copilot: Core Manifesto

> 一切细节都是这几条原则的展开。基于贝叶斯推断框架。

---

## The One Sentence

**系统通过贝叶斯更新最大化观测与假设的互信息 I(θ; ω)，在不确定性注入对抗下追求净信息增益，由价值函数约束假设空间，信息单调积累且可追溯。**

---

## Symbol System (符号系统)

| Symbol | Name | Meaning |
|--------|------|---------|
| $\Theta$ | 假设空间 | 所有可能的研究路径/结论 |
| $\theta \in \Theta$ | 假设 | 一个具体的研究假设/方向 |
| $\theta^*$ | 真实假设 | 实际正确的那个（未知） |
| $\omega_t$ | 观测 | 第 t 步获得的信息（实验结果、讨论、发现） |
| $\omega_{<t}$ | 观测历史 | 截至 t-1 的所有观测 |
| $a_t$ | 动作 | 第 t 步的决策（做什么实验、探索什么方向） |
| $P(\theta \mid \omega_{<t})$ | 后验 | 给定观测历史，对假设的信念分布 |

---

## Three Equations

### 1. Objective (目标)

$$
\mathcal{J}(\pi) = \underbrace{\mathbb{E}\left[ \sum_t H(\theta \mid \omega_{\leq t}) \right]}_{\text{累积后验不确定性}} - \beta \cdot \underbrace{\mathbb{E}\left[ \sum_t V_H(\theta) \right]}_{\text{假设的人类价值}}
$$

$$
\pi^* = \arg\min_\pi \mathcal{J}(\pi)
$$

**最小化对假设的后验不确定性**，同时**聚焦于人类认为有价值的假设空间**。

> **等价形式**: 最大化互信息 $I(\theta; \omega_{1:T})$

### 2. Dynamics (贝叶斯更新)

$$
P(\theta \mid \omega_{\leq t}) = \frac{P(\omega_t \mid \theta, a_t) \cdot P(\theta \mid \omega_{<t})}{P(\omega_t \mid \omega_{<t}, a_t)}
$$

**信息增益**:
$$
\Delta^+_t = H(\theta \mid \omega_{<t}) - H(\theta \mid \omega_{\leq t}) = I(\theta; \omega_t \mid \omega_{<t})
$$

| Term | Meaning |
|------|---------|
| $\Delta^+ = I(\theta; \omega_t \mid \omega_{<t})$ | 新观测带来的**信息增益** |
| $\Delta^-$ | 新问题/外部变化注入的不确定性 |

**Goal**: $\sum_t \Delta^{+} > \sum_t \Delta^{-}$ (累积净信息增益)

### 3. Information Value (信息价值)

$$
\text{IV}(\omega) = I(\omega; \theta) \cdot V_H(\theta)
$$

信息价值 = **与假设的互信息** × **人类对该假设的价值判断**

---

## Action Uncertainty (动作的不确定性)

**核心洞见**: 一切不确定性都是信念不确定性。

$$
P(a_t \mid \omega_{<t}) = P(a_t \text{ is optimal} \mid \omega_{<t}, \text{决策者的知识})
$$

```
为什么动作 a 看起来"随机"？

不是因为: 存在物理随机过程
而是因为: 决策者不确定哪个 a 最优

Human 选 a: 不确定哪个方向更好 → P(a*|knowledge) 是 spread out 的
Agent 选 a: 不确定哪个动作信息增益最大 → P(a*|belief) 是 spread out 的

本质相同: a 的不确定性 = 决策者对 "a* 是什么" 的信念不确定性
```

**随着信息积累**:
- $P(\theta \mid \omega)$ 越来越集中 → 对 θ 更确定
- $P(a^* \mid \omega)$ 越来越集中 → 对最优动作更确定
- 探索减少，利用增加

---

## Four Invariants

$$
\boxed{
\begin{aligned}
&\textbf{I-1:} \quad \omega_{\leq t} \subseteq \omega_{\leq t+1} & \text{观测历史单调积累} \\
&\textbf{I-2:} \quad \mathbb{E}[H(\theta|\omega_{\leq T})] < H(\theta|\omega_0) & \text{后验熵最终减少} \\
&\textbf{I-3:} \quad \forall d, \; \exists \, \text{trace}(d) \to \omega_{\text{raw}} & \text{决策可追溯到原始观测} \\
&\textbf{I-4:} \quad d \in \mathcal{D}_{\text{strategic}} \Rightarrow V_H(d) > 0 & \text{战略决策需人类认可}
\end{aligned}
}
$$

---

## Two Entities

| Entity | Role | Characteristic |
|--------|------|----------------|
| **Agent** | 执行动作、收集观测、压缩信息 | 高吞吐，信念更新快 |
| **Human** | 定义 $V_H(\theta)$、战略决策 | 低吞吐，$V_H$ 准确但更新慢 |

**V_H 的角色**: 定义"哪些 θ 值得关心"

$$
\Theta_{\text{relevant}} = \{\theta : V_H(\theta) > \tau\}
$$

我们只关心 $H(\theta \mid \omega)$ 在 $\Theta_{\text{relevant}}$ 上的值。

---

## One Constraint

**有限上下文**

$$
|\omega_{\text{active}}| \leq L_{\text{ctx}}
$$

不能处理所有观测历史，必须选择。选择标准：$\text{IV}(\omega)$。

---

## Visual Summary

```
         ┌─────────────────────────────────────┐
         │  GOAL: min H(θ|ω), max I(θ;ω)       │
         │  subject to: V_H(θ) > 0             │
         └─────────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────┐
    │  Bayesian Update:                           │
    │  P(θ|ω_{≤t}) ∝ P(ω_t|θ,a_t) · P(θ|ω_{<t})  │
    │                                             │
    │  信息增益: Δ⁺ = I(θ; ω_t | ω_{<t})          │
    │  不确定性注入: Δ⁻ (新问题、外部变化)          │
    │                                             │
    │  目标: Σ Δ⁺ > Σ Δ⁻                          │
    └─────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ Agent       │  │ Human       │  │ Information │
    │ 执行 a      │  │ 定义 V_H(θ) │  │ ω 单调积累  │
    │ 收集 ω      │←─│ 战略决策    │─→│ 可追溯      │
    │ 更新 P(θ|ω) │  │             │  │             │
    └─────────────┘  └─────────────┘  └─────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Constraint: |ω| ≤ L   │
              │ → 选择高 IV(ω) 观测    │
              └───────────────────────┘
```

---

## Derived Principles (推导原则)

| Principle | Derivation |
|-----------|------------|
| 渐进式交付 | $L_{\text{ctx}}$ 有限 → 先传高 IV 观测 |
| 文档压缩 | ω 单调积累 + $L_{\text{ctx}}$ → 必须压缩，但保留 trace |
| 探索→利用 | $P(a^*\mid\omega)$ 随信息积累而集中 → 自然从探索转向利用 |
| 人类参与 | $V_H$ 定义假设空间 → 战略决策需人类 |
| 新问题分类 | $I(q; \theta)$ 判断 → 高互信息必须解决 |

---

## End Note

**所有系统设计都是这个贝叶斯框架的具体实现。**

| Core Principle | System Implementation |
|----------------|----------------------|
| $\min H(\theta\mid\omega)$ | 通过动作收集观测，贝叶斯更新 |
| I-1 (观测积累) | Document protocol, 不删除只归档 |
| I-3 (可追溯) | 文档 trace 链接到原始观测 |
| I-4 (人类认可) | Human-in-loop，V_H 定义假设空间 |
| $L_{\text{ctx}}$ 约束 | Progressive delivery, Peek tool |
| a 的不确定性 | 来自对 a* 的信念不确定性，随学习减少 |

细节见 [MANIFESTO_MATHEMATICAL.md](./MANIFESTO_MATHEMATICAL.md)。
