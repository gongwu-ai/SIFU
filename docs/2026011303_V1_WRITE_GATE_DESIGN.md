# v1 Write Gate Design

**Status**: Research Complete - Ready for Implementation
**Target**: Claude Code harness only (scoped for simplicity)

---

## Why v1 is the First Real Version

v0 (Commit Gate) is a POC only. It cannot enforce DNA-first because:
- Agent can just not commit
- No way to intercept writes
- No lifecycle hooks

**SIFU requires harness integration.** v1 uses CC hooks to actually enforce rules.

---

## Goal

Enforce DNA-first at **write time**, not just commit time.

```
v0 Commit Gate:  Agent writes freely → DNA checked at commit
v1 Write Gate:   Agent must have DNA → before write is allowed
```

---

## Research Findings: CC Hooks System ✅

**Claude Code has a native hooks system that perfectly fits our needs.**

### Key Capabilities

| Feature | Support |
|---------|---------|
| PreToolUse hook | ✅ Runs BEFORE tool execution |
| Intercept Write/Edit | ✅ Matcher supports `"Write\|Edit"` |
| Block execution | ✅ Exit code 2 = reject tool call |
| Get file path | ✅ stdin JSON contains `tool_input.file_path` |
| Show error to agent | ✅ stderr is shown when blocked |

### How It Works

```
Agent calls Edit/Write tool
         │
         ▼
   PreToolUse hook fires
         │
         ▼
   dna_enforcer.py runs
         │
         ├── file.dna exists? → exit 0 → Tool executes
         │
         └── file.dna missing? → exit 2 → Tool BLOCKED
                                          └── Error shown to agent
```

---

## v1 Implementation Plan

### File Structure

```
project/
├── .claude/
│   ├── settings.json       # Hook configuration
│   └── hooks/
│       └── dna_enforcer.py # DNA-first enforcement
├── SIFU.dna
└── src/
    ├── foo.py
    └── foo.py.dna
```

### Hook Configuration

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/dna_enforcer.py",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### DNA Enforcer Script

`.claude/hooks/dna_enforcer.py`:
```python
#!/usr/bin/env python3
"""SIFU DNA Enforcer: Blocks writes without .dna sidecar."""
import json
import sys
from pathlib import Path

EXEMPT_PATTERNS = [
    r"\.dna$", r"^SIFU\.dna$", r"^CLAUDE\.md$", r"^AGENTS\.md$",
    r"^\.git/", r"^\.venv/", r"^\.githooks/", r"^\.claude/",
    r"^archive/", r"^docs/", r"^tests/", r"^scripts/",
    r"\.gitignore$", r"\.json$", r"\.yaml$", r"\.yml$",
    r"\.toml$", r"\.md$", r"\.txt$",
]

def needs_dna(filepath: str) -> bool:
    import re
    for pattern in EXEMPT_PATTERNS:
        if re.search(pattern, filepath):
            return False
    return True

def main():
    data = json.load(sys.stdin)
    tool = data.get("tool_name", "")

    if tool not in ("Write", "Edit"):
        sys.exit(0)

    file_path = data.get("tool_input", {}).get("file_path", "")

    if not needs_dna(file_path):
        sys.exit(0)

    dna_path = f"{file_path}.dna"
    if not Path(dna_path).exists():
        print(f"SIFU BLOCKED: {file_path}", file=sys.stderr)
        print(f"DNA-first violation: {dna_path} does not exist", file=sys.stderr)
        print(f"Create the .dna file first, then write the code.", file=sys.stderr)
        sys.exit(2)  # Block

    sys.exit(0)  # Allow

if __name__ == "__main__":
    main()
```

---

## v1 Additional Features

### Write Threshold (防止逃避考试)

Track uncommitted changes, block writes after threshold:

```python
# In dna_enforcer.py, add:
def check_write_threshold():
    """Block if uncommitted changes exceed threshold."""
    import subprocess
    result = subprocess.run(
        ["git", "diff", "--stat", "--cached"],
        capture_output=True, text=True
    )
    # Parse line count, block if > 500 lines
    ...
```

### Bash Interception (optional)

Also intercept Bash for `echo >`, `sed -i`, etc.:

```json
{
  "matcher": "Write|Edit|Bash",
  "hooks": [...]
}
```

For Bash, check if command contains file redirect patterns.

---

## Option Analysis (Historical)

| Option | Verdict | Notes |
|--------|---------|-------|
| A. MCP Server | ❌ | Agent can bypass |
| **B. CC Hooks** | ✅ **CHOSEN** | Native support, perfect fit |
| C. Wrapper Process | ❌ | Fragile |
| D. FUSE | ❌ | Too complex |
| E. CC Extension | ⚠️ | Hooks are simpler |
| F. Soft Enforcement | ❌ | Not needed, have hard gate |

---

## SIFU Daemon (未实现)

### What is it?

A background process that automatically writes DNA at agent lifecycle events.

### Why needed?

Current system requires agent to manually write DNA. But:
- Agent might forget
- Agent might crash before writing DNA
- Context compaction might lose decision context

### Proposed Behavior

```
SIFU Daemon
     │
     ├── On agent session start
     │   └── Log session ID, timestamp
     │
     ├── On significant code changes (threshold)
     │   └── Prompt/auto-generate DNA summary
     │
     ├── On agent EOL / context compaction
     │   └── Summarize session decisions to DNA
     │
     └── On crash recovery
         └── Reconstruct DNA from git diff
```

### Implementation Options

1. **PostToolUse hook** - After each Edit/Write, update DNA
2. **Separate daemon process** - Background watcher
3. **CC session hooks** - SessionStart, Stop events

### Open Questions

- Who writes the DNA summary? (Same agent? Separate summarizer model?)
- How to detect "significant" changes worth logging?
- How to handle agent crash mid-session?

### Deferred to v1.1

SIFU Daemon is valuable but adds complexity. v1.0 focuses on Write Gate enforcement. Daemon can be added as v1.1.

---

## Implementation Checklist

### v1.0: Write Gate
- [ ] Create `.claude/hooks/dna_enforcer.py`
- [ ] Create `.claude/settings.json` with hook config
- [ ] Test: write without DNA → blocked
- [ ] Test: write with DNA → allowed
- [ ] Document usage in CLAUDE.md

### v1.1: Write Threshold
- [ ] Add threshold tracking to dna_enforcer.py
- [ ] Configurable threshold (default 500 lines)
- [ ] Block writes when threshold exceeded

### v1.2: SIFU Daemon
- [ ] Design daemon architecture
- [ ] Implement session tracking
- [ ] Auto-summarize on EOL

---

## References

- [Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
- PreToolUse, PostToolUse, Stop events
- Exit code 2 = block tool execution
