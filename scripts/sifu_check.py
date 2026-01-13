#!/usr/bin/env python3
"""SIFU pre-commit validator: enforces DNA-first development."""

import re
import subprocess
import sys
from pathlib import Path

# Patterns to exclude from sidecar requirement
EXCLUDE_PATTERNS = [
    r"\.dna$", r"^SIFU\.dna$", r"^CLAUDE\.md$", r"^AGENTS\.md$", r"^README\.md$",
    r"^\.git/", r"^\.venv/", r"^\.githooks/", r"^archive/", r"^docs/", r"^tests/", r"^scripts/",
    r"\.gitignore$", r"\.json$", r"\.yaml$", r"\.yml$", r"\.toml$", r"\.md$",
]


def run_git(args: list[str]) -> str:
    result = subprocess.run(["git"] + args, capture_output=True, text=True)
    return result.stdout.strip()


def get_staged_files() -> list[str]:
    output = run_git(["diff", "--cached", "--name-only", "--diff-filter=ACM"])
    return [f for f in output.split("\n") if f]


def should_require_sidecar(filepath: str) -> bool:
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, filepath):
            return False
    return True


def check_sidecar_exists(staged: list[str]) -> list[str]:
    """Check 1: Every code file needs a .dna sidecar."""
    errors = []
    for f in staged:
        if should_require_sidecar(f):
            dna_path = f + ".dna"
            if not Path(dna_path).exists() and dna_path not in staged:
                errors.append(f"Missing sidecar: {f} requires {dna_path}")
    return errors


def get_valid_dna_ids() -> set[str]:
    """Parse [DNA-###] IDs from SIFU.dna."""
    sifu_path = Path("SIFU.dna")
    if not sifu_path.exists():
        return set()
    content = sifu_path.read_text()
    return set(re.findall(r"\[DNA-\d+\]", content))


def check_dna_refs(staged: list[str]) -> list[str]:
    """Check 2: DNA refs must exist in SIFU.dna."""
    errors = []
    valid_ids = get_valid_dna_ids()
    for f in staged:
        if f.endswith(".dna") and f != "SIFU.dna":
            path = Path(f)
            if path.exists():
                content = path.read_text()
                refs = set(re.findall(r"\[DNA-\d+\]", content))
                invalid = refs - valid_ids
                for ref in invalid:
                    errors.append(f"Invalid ref in {f}: {ref} not in SIFU.dna")
    return errors


def check_append_only() -> list[str]:
    """Check 3: No deletions in .dna files."""
    errors = []
    diff = run_git(["diff", "--cached", "-U0", "--", "*.dna", "SIFU.dna"])
    current_file = None
    for line in diff.split("\n"):
        if line.startswith("diff --git"):
            match = re.search(r"b/(.+\.dna)$", line)
            current_file = match.group(1) if match else None
        elif line.startswith("-") and not line.startswith("---"):
            if current_file:
                errors.append(f"Deletion in {current_file}: append-only violated")
                current_file = None  # Report once per file
    return errors


def check_section_structure(staged: list[str]) -> list[str]:
    """Check 4: .dna files must have required sections."""
    errors = []
    for f in staged:
        if f.endswith(".dna") and f != "SIFU.dna":
            path = Path(f)
            if path.exists():
                content = path.read_text()
                if "## Decision Rationale" not in content:
                    errors.append(f"Missing section in {f}: '## Decision Rationale'")
                if "## Implementation History" not in content:
                    errors.append(f"Missing section in {f}: '## Implementation History'")
    return errors


def get_rationale_ids(content: str) -> set[str]:
    """Extract DNA IDs declared in Decision Rationale section."""
    # Find content between "## Decision Rationale" and "## Implementation History"
    match = re.search(
        r"## Decision Rationale\s*(.*?)(?=## Implementation History|$)",
        content,
        re.DOTALL,
    )
    if not match:
        return set()
    rationale_section = match.group(1)
    return set(re.findall(r"\[DNA-\d+\]", rationale_section))


def get_session_refs(content: str) -> set[str]:
    """Extract DNA IDs referenced in Implementation History sessions."""
    # Find content after "## Implementation History"
    match = re.search(r"## Implementation History\s*(.*)", content, re.DOTALL)
    if not match:
        return set()
    history_section = match.group(1)
    # Find all Refs lines and extract DNA IDs
    refs_pattern = r"- Refs?:\s*(.+)"
    refs_lines = re.findall(refs_pattern, history_section)
    all_refs = set()
    for line in refs_lines:
        all_refs.update(re.findall(r"\[DNA-\d+\]", line))
    return all_refs


def check_causal_order(staged: list[str]) -> list[str]:
    """Check 5: Session Refs must reference IDs declared in Rationale."""
    errors = []
    for f in staged:
        if f.endswith(".dna") and f != "SIFU.dna":
            path = Path(f)
            if path.exists():
                content = path.read_text()
                rationale_ids = get_rationale_ids(content)
                session_refs = get_session_refs(content)
                invalid = session_refs - rationale_ids
                for ref in invalid:
                    errors.append(
                        f"Causal order violation in {f}: {ref} not in Decision Rationale"
                    )
    return errors


def main() -> int:
    staged = get_staged_files()
    if not staged:
        return 0

    errors = []
    errors.extend(check_sidecar_exists(staged))
    errors.extend(check_dna_refs(staged))
    errors.extend(check_append_only())
    errors.extend(check_section_structure(staged))
    errors.extend(check_causal_order(staged))

    if errors:
        print("SIFU check failed:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("SIFU check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
