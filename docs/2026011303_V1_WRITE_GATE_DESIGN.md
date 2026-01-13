# v1 Write Gate Design

**Status**: Draft
**Target**: Claude Code harness only (scoped for simplicity)

---

## Goal

Enforce DNA-first at **write time**, not just commit time.

```
v0 Commit Gate:  Agent writes freely → DNA checked at commit
v1 Write Gate:   Agent must have DNA → before write is allowed
```

---

## The Core Problem

How do we intercept Claude Code's file write operations?

```
Claude Code Agent
       │
       ├── Edit tool call
       ├── Write tool call
       ├── Bash (echo >, sed, etc.)
       │
       ▼
   Filesystem
```

We need to insert SIFU between the agent and the filesystem.

---

## Option Analysis

### Option A: MCP Server

**How it works**: SIFU exposes file operations as MCP tools. Agent calls SIFU instead of native tools.

```
Agent → sifu_write(file, content) → SIFU checks DNA → writes file
```

**Problem**: MCP requires agent to *actively call* SIFU tools.
- Agent can bypass by using native Edit/Write
- No enforcement, just convenience
- Relies on CLAUDE.md telling agent to use SIFU tools

**Verdict**: ❌ Not a gate, just an optional path

---

### Option B: Claude Code Hooks (if available)

**How it works**: Claude Code provides hook points for tool calls.

```
Agent → Edit tool → [pre-edit hook] → SIFU check → allow/deny
```

**Problem**: Does Claude Code have such hooks?
- Need to investigate Claude Code architecture
- May require forking/modifying Claude Code

**Verdict**: ⚠️ Unknown feasibility, needs research

---

### Option C: Wrapper Process

**How it works**: SIFU launches Claude Code as subprocess, intercepts stdio.

```
User → SIFU CLI → spawns Claude Code → intercepts tool calls via stdio
```

**Problem**:
- Claude Code tool calls may not go through stdio
- Complex to parse and intercept
- Fragile if CC internals change

**Verdict**: ⚠️ Hacky, fragile

---

### Option D: Filesystem Layer (FUSE)

**How it works**: Mount project directory through FUSE, intercept all writes.

```
Agent → writes to /project/foo.py → FUSE intercepts → SIFU checks → allow/deny
```

**Problem**:
- Complex (v2 territory)
- Cross-platform issues
- Overkill for v1

**Verdict**: ❌ Too complex for v1

---

### Option E: Claude Code Extension/Plugin

**How it works**: If Claude Code supports extensions, build SIFU as extension.

```
Claude Code + SIFU Extension
       │
       └── Extension hooks into tool execution
```

**Problem**:
- Does Claude Code have extension API?
- Need to research CC architecture

**Verdict**: ⚠️ Best if available, needs research

---

### Option F: Modify CLAUDE.md + Soft Enforcement

**How it works**: Strong instructions in CLAUDE.md + periodic audit.

```markdown
# CLAUDE.md

## SIFU Rules (CRITICAL)

Before ANY file write:
1. Check if {file}.dna exists
2. If not, create DNA first
3. Only then write the code

Violation = audit failure
```

**Problem**:
- Not a hard gate
- Agent can ignore instructions
- Relies on agent being "good"

**Verdict**: ⚠️ Soft enforcement, but easy to implement

---

## Research Needed

### Q1: Claude Code Architecture

- How does Claude Code execute tool calls?
- Is there a plugin/extension system?
- Are there pre/post hooks for tools?
- Can we intercept at the SDK level?

### Q2: Claude Code Source

- Is Claude Code open source?
- Can we fork and add hooks?
- What's the license?

### Q3: Anthropic SDK

- Does the SDK have interceptor patterns?
- Can we wrap the client?

---

## Interim Approach (v1.0)

While researching hard enforcement, ship soft enforcement:

### v1.0: Enhanced CLAUDE.md + Audit

1. **Stronger CLAUDE.md rules**
   - Explicit DNA-first workflow
   - Step-by-step instructions
   - Warning about audit consequences

2. **Audit script**
   - Run periodically or on-demand
   - Check: every code file has DNA
   - Check: DNA timestamps precede code changes
   - Report violations

3. **Write threshold (soft)**
   - Track uncommitted changes
   - Warn agent when threshold exceeded
   - Log warnings for audit

### v1.1: Hard Gate (pending research)

- Implement based on research findings
- May require Claude Code modifications
- Or OS-level interception

---

## Open Questions

1. **Claude Code internals**: How do we get visibility into CC architecture?
2. **Anthropic contact**: Can we ask Anthropic about extension points?
3. **Community**: Are others building CC extensions?

---

## Next Steps

- [ ] Research Claude Code architecture
- [ ] Check if CC is open source
- [ ] Explore Anthropic SDK for hooks
- [ ] Implement v1.0 soft enforcement as interim
- [ ] Document findings in this doc

---

## References

- [Claude Code docs](https://docs.anthropic.com/claude-code)
- [MCP specification](https://modelcontextprotocol.io)
