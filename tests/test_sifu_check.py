#!/usr/bin/env python3
"""Unit tests for sifu_check.py validator."""

import os
import subprocess
import tempfile
import unittest
from pathlib import Path

# Import the validator functions
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
from sifu_check import (
    should_require_sidecar,
    get_valid_dna_ids,
    get_rationale_ids,
    get_session_refs,
    check_section_structure,
    check_causal_order,
    check_dna_refs,
)


class TestSidecarRequirement(unittest.TestCase):
    """Tests for Check 1: Sidecar existence logic."""

    def test_code_file_requires_sidecar(self):
        """Code files should require a sidecar."""
        self.assertTrue(should_require_sidecar("src/foo.py"))
        self.assertTrue(should_require_sidecar("lib/bar.rs"))
        self.assertTrue(should_require_sidecar("main.go"))

    def test_dna_files_excluded(self):
        """DNA files themselves don't need sidecars."""
        self.assertFalse(should_require_sidecar("foo.py.dna"))
        self.assertFalse(should_require_sidecar("SIFU.dna"))

    def test_config_files_excluded(self):
        """Config files don't need sidecars."""
        self.assertFalse(should_require_sidecar(".gitignore"))
        self.assertFalse(should_require_sidecar("package.json"))
        self.assertFalse(should_require_sidecar("config.yaml"))
        self.assertFalse(should_require_sidecar("pyproject.toml"))

    def test_special_dirs_excluded(self):
        """Files in special directories don't need sidecars."""
        self.assertFalse(should_require_sidecar(".git/config"))
        self.assertFalse(should_require_sidecar(".venv/bin/python"))
        self.assertFalse(should_require_sidecar("archive/old.py"))
        self.assertFalse(should_require_sidecar("docs/readme.md"))
        self.assertFalse(should_require_sidecar("tests/test_foo.py"))
        self.assertFalse(should_require_sidecar("scripts/build.py"))

    def test_markdown_excluded(self):
        """Markdown files don't need sidecars."""
        self.assertFalse(should_require_sidecar("README.md"))
        self.assertFalse(should_require_sidecar("CLAUDE.md"))
        self.assertFalse(should_require_sidecar("AGENTS.md"))


class TestDnaIdParsing(unittest.TestCase):
    """Tests for DNA ID extraction."""

    def test_get_valid_dna_ids(self):
        """Extract DNA IDs from SIFU.dna content."""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            Path("SIFU.dna").write_text(
                "[DNA-001] First decision\n"
                "[DNA-002] Second decision\n"
                "[DNA-100] Hundredth decision\n"
            )
            ids = get_valid_dna_ids()
            self.assertEqual(ids, {"[DNA-001]", "[DNA-002]", "[DNA-100]"})

    def test_get_rationale_ids(self):
        """Extract IDs from Decision Rationale section only."""
        content = """
## Decision Rationale
- [DNA-001] This is declared
- [DNA-005] This is also declared

## Implementation History
### Session: xxx
- Refs: [DNA-001], [DNA-099]
"""
        ids = get_rationale_ids(content)
        self.assertEqual(ids, {"[DNA-001]", "[DNA-005]"})

    def test_get_session_refs(self):
        """Extract IDs from Implementation History Refs."""
        content = """
## Decision Rationale
- [DNA-001] Declared

## Implementation History
### Session: 2026-01-13
- Refs: [DNA-001], [DNA-002]
- Changes: Did something

### Session: 2026-01-14
- Refs: [DNA-003]
- Changes: Did more
"""
        refs = get_session_refs(content)
        self.assertEqual(refs, {"[DNA-001]", "[DNA-002]", "[DNA-003]"})


class TestSectionStructure(unittest.TestCase):
    """Tests for Check 4: Section structure."""

    def test_valid_sections(self):
        """File with both sections passes."""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            Path("foo.py.dna").write_text(
                "## Decision Rationale\n"
                "- [DNA-001] Something\n\n"
                "## Implementation History\n"
                "### Session: xxx\n"
            )
            errors = check_section_structure(["foo.py.dna"])
            self.assertEqual(errors, [])

    def test_missing_rationale_section(self):
        """File without Decision Rationale fails."""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            Path("foo.py.dna").write_text(
                "## Implementation History\n"
                "### Session: xxx\n"
            )
            errors = check_section_structure(["foo.py.dna"])
            self.assertEqual(len(errors), 1)
            self.assertIn("Decision Rationale", errors[0])

    def test_missing_history_section(self):
        """File without Implementation History fails."""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            Path("foo.py.dna").write_text(
                "## Decision Rationale\n"
                "- [DNA-001] Something\n"
            )
            errors = check_section_structure(["foo.py.dna"])
            self.assertEqual(len(errors), 1)
            self.assertIn("Implementation History", errors[0])


class TestCausalOrder(unittest.TestCase):
    """Tests for Check 5: Causal order."""

    def test_causal_order_ok(self):
        """Session refs only reference declared rationale IDs."""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            Path("foo.py.dna").write_text(
                "## Decision Rationale\n"
                "- [DNA-001] Declared decision\n"
                "- [DNA-005] Another decision\n\n"
                "## Implementation History\n"
                "### Session: xxx\n"
                "- Refs: [DNA-001]\n"
                "- Changes: Implemented it\n"
            )
            errors = check_causal_order(["foo.py.dna"])
            self.assertEqual(errors, [])

    def test_causal_order_violation(self):
        """Session refs undeclared ID fails."""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            Path("foo.py.dna").write_text(
                "## Decision Rationale\n"
                "- [DNA-001] Declared decision\n\n"
                "## Implementation History\n"
                "### Session: xxx\n"
                "- Refs: [DNA-999]\n"
                "- Changes: Implemented it\n"
            )
            errors = check_causal_order(["foo.py.dna"])
            self.assertEqual(len(errors), 1)
            self.assertIn("[DNA-999]", errors[0])
            self.assertIn("Causal order", errors[0])


class TestDnaRefs(unittest.TestCase):
    """Tests for Check 2: DNA refs valid in SIFU.dna."""

    def test_valid_ref(self):
        """Ref exists in SIFU.dna passes."""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            Path("SIFU.dna").write_text("[DNA-001] Global decision\n")
            Path("foo.py.dna").write_text(
                "## Decision Rationale\n"
                "- [DNA-001] Local ref\n\n"
                "## Implementation History\n"
            )
            errors = check_dna_refs(["foo.py.dna"])
            self.assertEqual(errors, [])

    def test_invalid_ref(self):
        """Ref not in SIFU.dna fails."""
        with tempfile.TemporaryDirectory() as tmpdir:
            os.chdir(tmpdir)
            Path("SIFU.dna").write_text("[DNA-001] Global decision\n")
            Path("foo.py.dna").write_text(
                "## Decision Rationale\n"
                "- [DNA-999] Invalid ref\n\n"
                "## Implementation History\n"
            )
            errors = check_dna_refs(["foo.py.dna"])
            self.assertEqual(len(errors), 1)
            self.assertIn("[DNA-999]", errors[0])


if __name__ == "__main__":
    unittest.main()
