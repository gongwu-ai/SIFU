#!/usr/bin/env bash
# SIFU init script - bootstrap DNA-first development in any project
set -e

SIFU_REPO="https://raw.githubusercontent.com/w3nhao/Sifu-local/main"

echo "Initializing SIFU in $(pwd)..."

# Check if git repo
if [ ! -d ".git" ]; then
    echo "Error: Not a git repository. Run 'git init' first."
    exit 1
fi

# Create directories
mkdir -p scripts .githooks

# Download SIFU files
echo "Downloading SIFU.dna..."
curl -sSL "$SIFU_REPO/SIFU.dna" -o SIFU.dna

echo "Downloading sifu_check.py..."
curl -sSL "$SIFU_REPO/scripts/sifu_check.py" -o scripts/sifu_check.py
chmod +x scripts/sifu_check.py

echo "Downloading pre-commit hook..."
curl -sSL "$SIFU_REPO/.githooks/pre-commit" -o .githooks/pre-commit
chmod +x .githooks/pre-commit

# Configure git hooks
git config core.hooksPath .githooks

echo ""
echo "SIFU initialized successfully!"
echo ""
echo "Files created:"
echo "  - SIFU.dna          (global decision registry)"
echo "  - scripts/sifu_check.py"
echo "  - .githooks/pre-commit"
echo ""
echo "Next steps:"
echo "  1. Add your first decision to SIFU.dna:"
echo "     [DNA-006] Your project-specific decision here."
echo ""
echo "  2. For each code file, create a .dna sidecar:"
echo "     src/foo.py     -> src/foo.py.dna"
echo ""
echo "  3. Commit and the hook will validate DNA integrity."
echo ""
echo "Happy DNA-first coding!"
