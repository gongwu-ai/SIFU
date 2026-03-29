---
name: codex
description: "Delegate review/audit tasks to Codex agent in the project directory. Use when you want an independent second opinion on documents, code, or analysis from a different model. Handles AGENTS.md injection, haiku wrapper dispatch, and result collection."
---

# Delegate to Codex

三步走：准备 → 发动 → 收集。Codex 是独立的 Critic/Auditor，跑不同的模型，提供第二视角。

## Step 1: 准备 AGENTS.md

在项目根目录确保 AGENTS.md 存在（codex 的 system prompt）：

```bash
PROJECT_DIR="/data/wenh/20260120_virec_fusion"
cp "$PROJECT_DIR/.claude/skills/codex/AGENTS_TEMPLATE.md" "$PROJECT_DIR/AGENTS.md"
```

AGENTS.md 常驻项目根目录，无需每次重新复制。

## Step 2: 派出 haiku agent 执行 codex

用 Agent tool 派一个 haiku model agent。

Codex 命令模板：

```bash
cd {PROJECT_DIR} && codex exec --ephemeral --dangerously-bypass-approvals-and-sandbox -o /tmp/codex_audit_$(date +%s).md "Review {文件名} for {审阅角度}. 把你的 verdict 写在最后一条消息里。"
```

参数说明：
- `--ephemeral`：不持久化 session
- `--dangerously-bypass-approvals-and-sandbox`：跳过 bwrap sandbox（我们的环境已经外部沙箱化，不需要 codex 自带的 bwrap）。**没有这个参数 codex 在无 bwrap 环境下无法执行任何 shell 命令。**
- `-o`：把 codex 最后一条消息写到文件（这是 deliverable）
- deliverable 输出到 `/tmp/` 避免污染项目目录

其他可用 sandbox 选项（按安全等级）：
- `-s read-only`：只读文件系统
- `-s workspace-write`：可写工作目录（默认）
- `-s danger-full-access`：完全访问
- `-c 'sandbox_permissions=["disk-full-read-access"]'`：细粒度控制

Agent 派发模板：

```
Agent(model=haiku, run_in_background=true):
  你是 codex-haiku-wrapper。严格按照你的 agent 规则执行。

  运行以下 bash 命令，timeout 600 秒：
  cd {PROJECT_DIR} && codex exec --ephemeral --dangerously-bypass-approvals-and-sandbox -o /tmp/codex_audit.md "{prompt}"

  命令完成后，用 Read tool 读取 /tmp/codex_audit.md，把全部内容原样返回。
  不要加任何自己的判断、总结、或修改。
```

## Step 3: 收集结果 + GPT Critic

haiku 返回后：

1. **读取 audit 内容**，检查 verdict 和 score
2. **用 `/gpt-critic` skill 分析 Codex 的交付物**：Claude 按照 gpt-critic 的流程（分类→验证 MUST-FIX→评估 SHOULD-FIX→输出报告）对 Codex 意见做独立判断。识别 false positive、验证真 bug、评估 ROI。
3. **综合决策**（在分析完成后）：
   - 验证通过 → pass
   - 有真 MUST-FIX → 根据列表决定修改范围
   - 有 false positive → 标注并跳过
   - 避免过度 audit 循环（最多 2 轮）
4. **清理**：`rm -f /tmp/codex_audit*.md`

## 关键教训（踩坑经验）

1. **codex exec 是同步阻塞的**，典型耗时 10+ 分钟。**绝不能在主线程阻塞等待**。必须包在 background haiku agent 里，或用 `Bash(run_in_background=true)`。
2. **Prompt 必须指定 deliverable 文件路径**。codex 的 raw stdout 极其嘈杂（thinking tokens、exec logs），不能直接当交付物。始终用 `-o` 参数或在 prompt 里写明 "Write your verdict to /path/to/audit.md"。
3. **单个 haiku agent 包全流程**。不要分别跑 bash(bg) + haiku(bg)，否则会收到双重通知。一个 haiku agent 内部 foreground 跑 codex → Read deliverable → 返回，主 agent 只收一次通知。
4. **Haiku agent 不要自己做审阅**。Haiku prompt 必须给精确的 bash 命令，并明确写 "do NOT perform the review yourself"，防止 haiku 跳过 codex 自己审。
5. **Haiku sub-agent 没有 TaskOutput 工具**，需要用 Bash 轮询或直接 foreground 等待。
6. **必须加 `--dangerously-bypass-approvals-and-sandbox`**。我们的运行环境已经外部沙箱化（容器/VM），不需要 codex 自带的 bwrap namespace sandbox。没有这个参数，codex 在无 bwrap 的环境下所有 shell 命令都会失败（`No permissions to create a new namespace`），导致审计无法读取文件。

## 什么时候用 Codex

- 想要不同模型视角的 second opinion
- 文档/代码的独立审阅（codex 没看过讨论上下文，视角更干净）
- 逻辑一致性检查（codex 没有 sunk cost）

## 什么时候不用

- 纯格式/排版问题（自己改更快）
- 涉及敏感上下文（.env 相关的配置工作）
- 简单 typo 修复
