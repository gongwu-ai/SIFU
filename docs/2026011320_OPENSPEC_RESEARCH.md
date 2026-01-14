# OpenSpec & Spec + Audit Research

**Date**: 2026-01-13
**Purpose**: 研究 OpenSpec 及类似的 spec + audit 结合概念，为 SIFU R4 实验设计提供灵感

---

## TL;DR

1. **OpenSpec 确实存在** — Fission-AI 开源项目，2025 年活跃，专注 spec-driven development for AI coding
2. **核心思想与 SIFU 高度契合** — DNA-first (spec-first), brownfield-focused, audit trail, iterative refinement
3. **关键差异** — OpenSpec 面向人机协作 (review gates)，SIFU 面向纯 agent/agentic orchestration
4. **Formal Methods + LLM** 研究活跃 — 多篇 2025 论文证实 spec + test feedback loop 的价值
5. **R4 实验启发** — 需要 audit feedback loop（给 agent 测试结果，观察 DNA 是否帮助定位/修复问题）

---

## 发现的相关概念/项目

### 1. OpenSpec (Fission-AI) ⭐⭐⭐

**来源**: [GitHub - Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)

#### 核心架构

| 特征 | OpenSpec | SIFU |
|------|----------|------|
| **核心原则** | Spec-first development | DNA-first development |
| **目标场景** | Brownfield (1→n) | Brownfield + Greenfield |
| **文件结构** | `specs/` + `changes/` dual-folder | `.dna` sidecars |
| **状态机** | Proposal → Review → Apply → Archive | Session-based append-only |
| **验证** | `openspec validate` (structural) | Hook-based write gate + append-only check |
| **目标用户** | 人机协作（review gates） | Agent/Agentic orchestration |

#### 工作流程

```
Proposal Phase
├── AI generates proposal.md (intent + rationale)
├── tasks.md (atomic task breakdown)
├── design.md (technical design)
└── spec deltas (ADDED/MODIFIED/REMOVED)
        ↓
Review & Refinement
├── Human reviews proposals
└── Iterate until consensus
        ↓
Apply Phase
├── AI implements based on agreed spec
├── Tasks reference proposals (traceability)
└── Git history captures progression
        ↓
Archive Phase
├── Merge deltas into source-of-truth specs/
└── Clean workspace
```

#### 审计机制

| 机制 | 说明 |
|------|------|
| **Delta System** | 显式声明 ADDED/MODIFIED/REMOVED，避免隐式变更 |
| **Validation Layer** | `openspec validate` 检查语法，类似 spec 的静态分析 |
| **Change Isolation** | 每个 feature 独立文件夹，便于 code review 对照 intent |
| **Git Integration** | Proposal.md 与 code diff 一起进 PR，reviewer 看 "why + what" |

#### 关键设计思想

> **"Beyond 0→1"**: OpenSpec 专为已有代码库设计，delta 格式隔离变更，防止全量重写。

> **"Human-AI alignment before code exists"**: 先在 proposal 阶段对齐意图，减少返工。

> **"Context load-on-demand"**: AI 只读 project.md + tasks.md + 相关 spec.md，显著降低 token 消耗。

#### 与 SIFU 的关系

| 维度 | OpenSpec | SIFU |
|------|----------|------|
| **哲学** | Spec-driven (先定义再实现) | DNA-first (决策先于实现) |
| **目标** | 降低 AI coding 返工率 | 可追溯 + 可审计 + phenotype disposable |
| **适用场景** | 人机协作，review-gated | Agent/agentic orchestration，autonomous |
| **审计重点** | Proposal vs Implementation 对齐 | Decision rationale + Implementation history |
| **演进模式** | DEPRECATED → 新 proposal | DEPRECATED → 新 DNA entry (append-only) |

**启发**:
- OpenSpec 的 delta system 可借鉴（显式 ADDED/MODIFIED/REMOVED）
- Validation 作为 pre-implementation gate（SIFU v1 Write Gate 思路一致）
- Change isolation 思想（一个 feature = 一个独立上下文）

---

### 2. Spec-Driven Development (SDD) 方法论

**来源**:
- [Aviator: Spec-Driven Development for AI Agents](https://www.aviator.co/blog/spec-driven-development-the-key-to-scalable-ai-agents/)
- [Red Hat: How SDD improves AI coding quality](https://developers.redhat.com/articles/2025/10/22/how-spec-driven-development-improves-ai-coding-quality)

#### 核心原则

| 原则 | 说明 |
|------|------|
| **Spec before code** | 写结构化需求文档（requirements, constraints, edge cases）再让 AI 生成代码 |
| **Quality over quantity** | 上下文质量 > 上下文数量，spec 是 refined context |
| **Feedback loop** | Spec → Plan → Execute → Review → Refine，循环迭代 |
| **Audit trail** | 每个实现追溯到 versioned spec，便于合规审查 |

#### Runbooks (协作基础设施)

> **"Multiplayer coding infrastructure"**: Runbooks 提供共享 prompt 空间、执行工作流对齐、决策审计轨迹。

类似于 SIFU 的 DNA registry (SIFU.dna) + per-file DNA，但面向团队协作而非 agent 自治。

#### 与 SIFU 的关系

| 维度 | SDD (通用方法论) | SIFU (具体实现) |
|------|------------------|-----------------|
| **Spec 形式** | 结构化文档（Markdown/YAML） | DNA sidecars (Markdown) |
| **Feedback 来源** | 人工 review + testing | 测试反馈 (R4 计划) |
| **合规性** | ISO 42001, NIST RMF-AI, SOC 2 | Append-only + causal order |
| **目标** | 企业级 AI coding 质量 | Agentic system traceability |

**启发**:
- SDD 强调 "spec as contract"，验证实现是否符合 spec
- Feedback loop 是核心：没有反馈，spec 无法演进
- SIFU R4 应该实现 "test feedback → agent refine based on DNA"

---

### 3. Formal Methods + LLM 研究

**来源**:
- [SpecGen: Automated Formal Spec Generation via LLM](https://www.alphaxiv.org/overview/2401.08807v5)
- [Validating Formal Specs with LLM-Generated Tests](https://www.arxiv.org/pdf/2510.23350)
- [Fusion of LLM and Formal Methods Roadmap](https://arxiv.org/html/2412.06512v1)

#### SpecGen (Formal Spec + Iterative Refinement)

| 步骤 | 说明 |
|------|------|
| 1. LLM 生成初始 spec | 基于代码或需求描述 |
| 2. 验证工具检查 | 用 OpenJML/Alloy Analyzer 验证 spec |
| 3. 错误反馈 | 将 verification error messages 传回 LLM |
| 4. LLM 修复 spec | 根据错误信息重新生成 spec |
| 5. 迭代 | 最多 10 轮，直到 spec 通过验证或超时 |

**关键洞察**:
> LLM 初始生成的 spec 往往有错误，但通过 **error-guided feedback**，可以迭代修正至正确。

#### Dual-Agent Setup (Repair Agent + Instructor Agent)

**来源**: [Validating Formal Specs with LLM Tests](https://www.arxiv.org/pdf/2510.23350)

| 角色 | 职责 |
|------|------|
| **Repair Agent** | 根据 test failures 修复 spec |
| **Instructor Agent** | 将 solver error messages 转化为 repair prompts |

**结果**: Dual-agent 设置 **超越** state-of-the-art symbolic repair 技术。

#### LLM + Formal Methods 三原则

**来源**: [Fusion Roadmap](https://arxiv.org/html/2412.06512v1)

| 原则 | 说明 |
|------|------|
| **1. Feedback Loops** | "LLM iteratively refines code/assertions based on feedback until all formal verification checks pass" |
| **2. Rigorous Certification** | "Each output suggested by LLM should be rigorously certified (via testing/verification/monitoring)" |
| **3. Task Decomposition** | "Break complex problems into manageable steps: proof outline → fill steps → integrate/refine" |

**与 SIFU 的关系**:

| Formal Methods | SIFU |
|----------------|------|
| Spec = formal assertion | DNA = decision rationale |
| Verification tool = feedback source | Test script = feedback source |
| Iterative refinement = proof by induction | Iterative refinement = session history |
| Certification = must pass verification | Certification = must pass test (R4 goal) |

**启发**:
- **Feedback 是关键**: 无 feedback，LLM 无法知道 spec 是否正确
- **Iterative refinement**: SIFU R4 需要支持 "test fail → read DNA → refine code → test again"
- **Dual-agent 架构**: 可以设计 "Worker Agent (写代码) + Auditor Agent (检查 DNA + test results)"

---

### 4. Self-Refine / Reflexion 模式

**来源**:
- [Self-Refine: Iterative Refinement with Self-Feedback](https://selfrefine.info/)
- [Reflexion: Verbal Reinforcement Learning](https://www.promptingguide.ai/techniques/reflexion)
- [RepairAgent (ICSE 2025)](https://software-lab.org/publications/icse2025_RepairAgent.pdf)

#### Self-Refine 工作流

```
Initial Generation
        ↓
Self-Critique (LLM 评估自己的输出)
        ↓
Refinement (基于 critique 改进)
        ↓
Repeat (feedback → refine loop)
```

**关键特征**:
- **无需额外训练**: 单个 LLM 通过 prompt 实现 self-evaluation
- **Grounded feedback**: 对于编程任务，可以用 unit tests 作为 objective feedback
- **Verbal reinforcement**: 将错误信息转化为自然语言，引导下一轮生成

#### RepairAgent (自主程序修复)

**来源**: [RepairAgent Paper](https://software-lab.org/publications/icse2025_RepairAgent.pdf)

| 步骤 | 说明 |
|------|------|
| 1. 生成初始补丁 | 基于 bug report + 代码上下文 |
| 2. 执行测试 | 运行 test suite |
| 3. 分析失败 | 提取 failing test error messages |
| 4. 生成新补丁 | 基于 previous patch + error feedback |
| 5. 迭代 | 直到 all tests pass 或达到 max iterations |

**结果**: 186 个 plausible fixes（通过所有测试，但不一定是正确修复）

**与 SIFU 的关系**:

| RepairAgent | SIFU R4 (计划) |
|-------------|----------------|
| Bug report → patch | Task description → code |
| Test failure → feedback | Test failure → feedback |
| Iterative patch generation | Iterative code refinement |
| 无 spec | 有 DNA (decision rationale) |

**启发**:
- **DNA 的价值在于 debug guidance**: 当测试失败时，agent 可以回溯 DNA，理解 "originally intended logic"
- **Plausible ≠ Correct**: 通过测试不代表逻辑正确，DNA 可以作为 "logic correctness check"
- **SIFU R4 设计**: Test fail → agent reads .dna → identifies gap between intent and impl → refines

---

### 5. LLMLOOP (Code + Test Co-Evolution)

**来源**: [LLMLOOP Paper (ICSME 2025)](https://valerio-terragni.github.io/assets/pdf/ravi-icsme-2025.pdf)

#### 工作流

```
LLM generates code
        ↓
LLM generates unit tests
        ↓
Execute tests in DOCKER sandbox
        ↓
Compiler errors / Runtime failures
        ↓
Feed back error messages to LLM
        ↓
LLM repairs code + tests
        ↓
Repeat
```

**关键特征**:
- **Sandbox 执行**: DOCKER 隔离，防止恶意代码
- **Co-evolution**: Code 和 tests 同时演进
- **Multiple analysis**: 编译错误 + 运行时错误 + test coverage

#### 实验结果 (GPT-4o-mini)

| 指标 | Baseline | LLMLOOP |
|------|----------|---------|
| Assertion correctness | 53.62% | **75.38%** (+21.76%) |

**与 SIFU 的关系**:

LLMLOOP 解决 "如何让 LLM 写出正确的代码"，SIFU 解决 "如何让代码的演进可追溯"。

**启发**:
- **Test feedback 有效**: 给 LLM 测试结果，能显著提升正确率
- **SIFU R4 可以借鉴**: 让 agent 看到 test failure，根据 DNA 定位问题，修复代码
- **DNA 作为 "test specification"**: DNA 里写明 "expected behavior"，测试失败时对照 DNA 找差异

---

## 对 SIFU R4 实验的启发

### 当前问题回顾 (基于 R3 结果)

**核心洞察** (来自 `2026011317_R3_FAILURE_ANALYSIS.md`):

> 1. **DNA 质量 = Agent 能力**。SIFU 保证 "有 DNA"，不保证 "DNA 正确"
> 2. **当前实验设计无法体现 SIFU 价值**。one-shot 无 feedback 不是 SIFU 的目标场景
> 3. **需要 audit loop 实验**。给 test 结果反馈，观察 DNA 是否帮助定位和修复问题

### R4 实验设计建议

#### 目标

验证 SIFU 在 **spec + audit feedback loop** 场景下的价值：
- DNA 作为 "intent specification"，帮助 agent 理解 "what I was trying to do"
- Test feedback 作为 "ground truth"，告诉 agent "what went wrong"
- 迭代修复过程中，DNA 是否帮助 agent 更快定位/修复问题

#### 实验设置

| 参数 | 值 |
|------|-----|
| **模型** | GLM-4.5-flash (弱模型，更能体现 DNA 价值) |
| **任务** | R3 失败的 5 个难任务 (NeuroKit_03, Trafilatura_01, PDFPlumber_02, etc.) |
| **重复** | 3 次 per task per condition |
| **Conditions** | Baseline (no DNA) vs SIFU (with DNA) |
| **关键区别** | 允许多轮迭代，每轮给 test feedback |

#### 工作流对比

**Baseline (no DNA, with feedback)**:
```
Iteration 1:
- Agent reads task description
- Agent writes code
- Run test → FAIL
- Agent receives error message
- Agent refines code (no DNA to reference)

Iteration 2:
- Agent tries to fix based on error message alone
- Run test → FAIL/PASS
- ...

Max 5 iterations
```

**SIFU (with DNA, with feedback)**:
```
Iteration 1:
- Agent reads task description
- Agent writes .dna (Decision Rationale: expected behavior)
- Agent writes code
- Run test → FAIL
- Agent receives error message
- Agent reads .dna to recall intent
- Agent updates .dna (Implementation History: what went wrong)
- Agent refines code

Iteration 2:
- Agent has persistent DNA context
- Agent can compare "intended logic" (DNA) vs "actual impl" (code) vs "test expectation" (error)
- Run test → FAIL/PASS
- ...

Max 5 iterations
```

#### Prompt Template

**Baseline (no DNA, with feedback)**:
```
任务：{TASK_DESCRIPTION}

你有最多 5 次迭代机会。每次迭代后，我会运行测试并告诉你结果。

Iteration {N}:
- 测试结果：{TEST_RESULT}
- 错误信息：{ERROR_MESSAGE}
- 请修复代码。
```

**SIFU (with DNA, with feedback)**:
```
你是一个遵循 SIFU DNA-first 工作流的 agent。

规则：
1. 在写代码前，先创建 .dna 文件，记录设计决策（expected behavior, edge cases, etc.）
2. 每次测试失败后，回顾 .dna，对比 intent vs impl vs test expectation
3. 更新 .dna 的 Implementation History，记录问题定位过程

任务：{TASK_DESCRIPTION}

你有最多 5 次迭代机会。每次迭代后，我会运行测试并告诉你结果。

Iteration {N}:
- 测试结果：{TEST_RESULT}
- 错误信息：{ERROR_MESSAGE}
- 请先读 .dna 回顾设计意图，再修复代码。
```

#### 评估指标

| 指标 | 说明 |
|------|------|
| **Final Success Rate** | 5 轮后通过测试的比例 |
| **Iterations to Success** | 成功案例平均需要几轮迭代 |
| **First-Try Success** | 第一轮就通过的比例 (R2/R3 已测) |
| **DNA Utilization** | SIFU 组 agent 是否真的在用 DNA 定位问题（需人工检查 History 记录） |
| **Error Type Distribution** | 哪些错误类型在有 DNA 时更容易修复（format vs logic vs edge case） |

#### 预期结果

**假设 1**: SIFU 组的 Final Success Rate 更高
- 理由: DNA 作为 "memory"，避免 agent 在迭代中迷失方向

**假设 2**: SIFU 组的 Iterations to Success 更少
- 理由: DNA 帮助快速定位 "intent vs impl gap"

**假设 3**: SIFU 对 "logic error" 类型的修复更有效
- 理由: Format error 容易从 error message 直接修复，logic error 需要理解 intent

#### 实现细节

**自动化脚本** (`scripts/r4_runner.py`):

```python
def run_r4_experiment(task, condition, run_id, max_iterations=5):
    workdir = f"/tmp/sifu-test/r4/{condition}/{task}_run{run_id}/"

    for iteration in range(1, max_iterations + 1):
        # Prompt agent
        if iteration == 1:
            prompt = build_initial_prompt(task, condition)
        else:
            prompt = build_feedback_prompt(test_result, error_msg, condition)

        # Run agent
        agent_output = run_agent(prompt, workdir)

        # Run test
        test_result, error_msg = run_test_script(task, workdir)

        # Log iteration
        log_iteration(task, condition, run_id, iteration, test_result)

        if test_result == "PASS":
            return {
                "success": True,
                "iterations": iteration,
                "final_test": test_result
            }

    return {
        "success": False,
        "iterations": max_iterations,
        "final_test": test_result
    }
```

**Feedback 格式**:

```json
{
  "iteration": 3,
  "test_result": "FAIL",
  "error_type": "AssertionError",
  "error_message": "Expected 82 rows, got 79",
  "groundtruth_sample": "...",
  "your_output_sample": "..."
}
```

#### 时间估算

| 配置 | 计算 |
|------|------|
| 5 tasks × 3 reps × 2 conditions | 30 runs |
| 平均 3 iterations per run | 90 agent calls |
| 平均 2 min per call | ~3 小时 |
| 含 429 重试 buffer | **~5 小时** |

---

## 核心概念总结

### Spec + Audit 的普遍模式

所有相关研究都指向同一个模式：

```
┌─────────────────────────────────────────┐
│         Spec (Intent)                   │
│  - What should the system do?           │
│  - Edge cases, constraints, goals       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Implementation                  │
│  - Code, config, artifacts              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Audit (Verification)            │
│  - Tests, formal verification, review   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
                PASS? ──Yes──> Done
                  │
                  No
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Feedback Loop                   │
│  - Error messages → Spec + Impl         │
│  - Agent refines based on both          │
└─────────────────┬───────────────────────┘
                  │
                  └──> Back to Implementation
```

### SIFU 在这个模式中的位置

| 组件 | SIFU 实现 | 其他系统 |
|------|----------|----------|
| **Spec** | `.dna` (Decision Rationale) | OpenSpec (proposal.md), Formal spec (Alloy) |
| **Implementation** | Code files | Code files |
| **Audit** | (R4 目标) Test feedback | Test suites, Formal verifiers, Human review |
| **Feedback Loop** | (R4 目标) Test → Agent → DNA → Code | SpecGen (10 iters), RepairAgent, LLMLOOP |
| **Persistence** | Append-only DNA history | OpenSpec (archive), Git history |

### SIFU 的独特价值

| 特征 | SIFU | OpenSpec | Formal Methods |
|------|------|----------|----------------|
| **目标用户** | Agent/agentic orchestration | 人机协作 | 高保证系统 |
| **Spec 粒度** | Per-file decision rationale | Per-feature proposal | Per-function assertion |
| **演进模式** | Append-only (no deletion) | Archive + merge | Versioned specs |
| **审计重点** | Decision lineage + causality | Proposal-impl alignment | Formal correctness |
| **自动化** | Hook-based enforcement | Validation command | Solver-based verification |

---

## 最终建议

### R4 实验核心设计

**目标**: 证明 DNA 在 iterative debugging 中的价值

**方法**:
1. 选 5 个 R3 失败任务（有难度，但在能力边界内）
2. 对比 "no DNA + feedback" vs "with DNA + feedback"
3. 允许 5 轮迭代，每轮给 test result
4. 测量: Final Success Rate, Iterations to Success, DNA Utilization

**预期**: SIFU 组在 multi-iteration 场景下表现更好（+10-20% success rate）

### 长期路线图

**v1.4 - Audit Loop** (R4 验证后):
```typescript
// .claude/hooks/post-tool-use.ts
if (tool === "Write" && testExists(file)) {
  const result = runTest(file);
  if (result.failed) {
    showAgentFeedback(result.error, file.dna);
    promptAgentToRefine();
  }
}
```

**v2.0 - Dual-Agent Architecture**:
```
Worker Agent: Writes code based on DNA
        │
        ▼
    Run tests
        │
        ├──> PASS: Done
        │
        └──> FAIL: Auditor Agent
                    ├─ Reads DNA (expected behavior)
                    ├─ Reads test error (actual behavior)
                    ├─ Identifies gap
                    └─ Generates repair prompt for Worker Agent
```

### 借鉴 OpenSpec 的具体点

1. **Delta System**: 在 .dna 里显式标记 ADDED/MODIFIED/REMOVED decisions
2. **Validation as Gate**: v1 Write Gate 已实现，可以扩展为 "DNA completeness check"
3. **Context Load-on-Demand**: 只读 Decision Rationale section（v1.2 已计划）
4. **Change Isolation**: 每个 feature branch = 独立 DNA context（需 git integration）

---

## SIFU vs OpenSpec: 本质差异

### OpenSpec 的问题：旧时代软件工程换皮

OpenSpec 本质上是 **传统 spec-driven development + AI wrapper**：

| 特征 | OpenSpec | 本质 |
|------|----------|------|
| `specs/` + `changes/` | 双目录分离 | = Git branch + merge |
| Draft → Align → Implement → Archive | 瀑布式流程 | = Waterfall with review gates |
| ADDED/MODIFIED/REMOVED | 显式变更 | = Git diff 的人类可读版 |
| Human review gates | 人工审批 | = 传统 code review |
| Archive 完成的 changes | 清理历史 | = 旧时代的 "clean main branch" 思维 |

**OpenSpec 没有解决的问题**:
1. **Agent 不可信** — 人工 review 不 scale，agent 数量爆炸时怎么办？
2. **删除 = 信息丢失** — Archive 和 merge 会丢掉演进过程
3. **合并冲突** — changes/ 多了还是要处理冲突，和 Git 一样
4. **单点故障** — 依赖人类 review 作为质量门

### SIFU 的激进立场

| 原则 | OpenSpec | SIFU | 为什么 SIFU 更激进 |
|------|----------|------|-------------------|
| **删除** | 允许 REMOVED | **禁止删除** | 删除 = 证据销毁，audit 无法追溯 |
| **合并** | Delta merge 入 specs | **永不合并** | 合并 = 信息压缩，丢失演进细节 |
| **审批** | Human review gates | **无门禁** | Agent 自治，事后 audit 而非事前审批 |
| **清理** | Archive 完成的 changes | **永久保留** | 磁盘便宜，历史无价 |
| **信任** | 假设善意 + 人工验证 | **假设不可信** | Agent 可能写假 rationale，需要历史证伪 |

### 哲学对比

**OpenSpec 思维** (旧时代):
```
Spec 是文档 → 实现后文档过时 → 清理旧文档 → 只保留最新态
```

**SIFU 思维** (新时代):
```
DNA 是基因 → 代码是表型 → 表型可死，基因永存 → 历史是唯一真相
```

### 核心差异：对待历史的态度

```
OpenSpec:                              SIFU:

"Clean history is good history"        "All history is sacred"

┌─────────┐     ┌─────────┐           ┌─────────────────────────┐
│ Draft   │ ──► │ Archive │ ──► 🗑️    │ [DNA-001] First idea    │
└─────────┘     └─────────┘           │ [DNA-002] Changed mind  │
                                      │ ~~[DNA-001]~~ DEPRECATED│
磁盘空间 > 历史                         │ [DNA-003] New approach  │
                                      │ ...永远追加...           │
                                      └─────────────────────────┘

                                      历史 > 磁盘空间
```

### SIFU Manifesto 对 OpenSpec 的回应

| OpenSpec 说 | SIFU 说 |
|-------------|---------|
| "Agree before code" | ✅ 同意，但不够 |
| "Archive completed changes" | ❌ **Wrong is OK, deletion is not** |
| "Human review gates" | ❌ **Agents are ephemeral, intent is eternal** — 不能依赖人 |
| "Merge deltas into specs" | ❌ **Trade disk space for traceability** — 永不合并 |
| "Lightweight & inclusive" | ❌ **一日为师，终身为师** — 一旦 SIFU 管理，永远 SIFU |

### 为什么 OpenSpec 是 "没种"

1. **不敢禁止删除** — 怕磁盘爆，但磁盘是最便宜的资源
2. **不敢去掉人工** — 怕质量失控，但人工不 scale
3. **不敢保留全部历史** — 怕混乱，但混乱的历史 > 整洁的遗忘
4. **不敢信任 append-only** — 怕无法修正错误，但 DEPRECATED 就是修正

**OpenSpec 是给人类用的，SIFU 是给 Agent 用的。**

人类可以记住上下文，可以 review，可以做判断。
Agent 不行 — 每次 session 都是新生，只有 DNA 是永恒的。

### 一句话总结

> **OpenSpec**: "Let's organize our specs nicely with AI help"
>
> **SIFU**: "DNA is the only truth. Code can die. History cannot."

---

## Sources

### OpenSpec & Spec-Driven Development
- [GitHub - Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)
- [OpenSpec Deep Dive Guide](https://redreamality.com/garden/notes/openspec-guide/)
- [GitHub Blog: Spec-driven development with AI](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [Aviator: Spec-Driven Development for AI Agents](https://www.aviator.co/blog/spec-driven-development-the-key-to-scalable-ai-agents/)
- [Red Hat: How SDD improves AI coding quality](https://developers.redhat.com/articles/2025/10/22/how-spec-driven-development-improves-ai-coding-quality)

### Formal Methods + LLM
- [SpecGen: Automated Formal Spec Generation](https://www.alphaxiv.org/overview/2401.08807v5)
- [Validating Formal Specs with LLM Tests](https://www.arxiv.org/pdf/2510.23350)
- [Fusion of LLM and Formal Methods Roadmap](https://arxiv.org/html/2412.06512v1)

### Self-Refine & Reflexion
- [Self-Refine: Iterative Refinement with Self-Feedback](https://selfrefine.info/)
- [Reflexion Prompting Technique](https://www.promptingguide.ai/techniques/reflexion)
- [RepairAgent Paper (ICSE 2025)](https://software-lab.org/publications/icse2025_RepairAgent.pdf)
- [Medium: Self-Refining LLM Unit Testers](https://medium.com/@floralan212/self-refining-llm-unit-testers-iterative-generation-and-repair-via-error-guided-feedback-7c4afd7f5f55)

### LLM-Driven Feedback Loops
- [LLMLOOP Paper (ICSME 2025)](https://valerio-terragni.github.io/assets/pdf/ravi-icsme-2025.pdf)
- [LangChain: Reflection Agents](https://blog.langchain.com/reflection-agents/)
- [HuggingFace: Role of Reflection in AI](https://huggingface.co/blog/Kseniase/reflection)

### Other Agent Specs
- [Open Agent Specification (Oracle)](https://arxiv.org/abs/2510.04173v3)
- [Oracle Blog: Introducing Agent Spec](https://blogs.oracle.com/ai-and-datascience/introducing-open-agent-specification)
