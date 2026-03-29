#!/usr/bin/env node
/**
 * SIFU DNA Enforcer Hook (v4)
 *
 * PreToolUse hook: blocks file writes without valid .dna.md sidecar.
 * Only activates in projects with SIFU.dna.md at root.
 *
 * Exit 0 = allow, Exit 2 = block.
 * Zero dependencies.
 */

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

// Only exempt auto-generated, binary, and tool internals.
const EXEMPT_DIRS = new Set([
  ".git", ".claude", ".cursor", ".codex", ".opencode", ".github",
  ".venv", "__pycache__", "node_modules",
  "dist", "build", ".next", ".nuxt",
]);

const EXEMPT_EXTENSIONS = new Set([
  ".dna.md",
  ".lock",
  ".pyc", ".pyo", ".pyd", ".so", ".dll", ".dylib",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".pdf", ".zip", ".tar", ".gz", ".bz2",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp3", ".mp4", ".wav", ".avi",
  ".log",
]);

const EXEMPT_FILENAMES = new Set([
  "SIFU.dna.md",
  ".gitignore", ".claudeignore",
  ".env", ".env.local",
  "__init__.py",
  "LICENSE",
]);

function needsDna(relPath) {
  const name = path.basename(relPath);
  if (EXEMPT_FILENAMES.has(name)) return false;
  // Check compound extension .dna.md
  if (relPath.endsWith(".dna.md")) return false;
  const ext = path.extname(relPath);
  if (EXEMPT_EXTENSIONS.has(ext)) return false;
  const parts = relPath.replace(/\\/g, "/").split("/");
  for (const part of parts) {
    if (EXEMPT_DIRS.has(part)) return false;
  }
  return true;
}

function validateDna(dnaPath) {
  try {
    const content = fs.readFileSync(dnaPath, "utf-8");
    // Must have at least one DNA entry: - [DNA-###]
    if (!/\[DNA-\d+\]/.test(content)) {
      return { valid: false, error: "No [DNA-###] entry found" };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Cannot read: ${e.message}` };
  }
}

function findProjectRoot() {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.resolve(dir, "SIFU.dna.md"))) return dir;
    if (fs.existsSync(path.resolve(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

async function readStdin() {
  const rl = readline.createInterface({ input: process.stdin });
  const lines = [];
  for await (const line of rl) lines.push(line);
  return lines.join("\n");
}

async function main() {
  try {
    const data = JSON.parse(await readStdin());
    const toolName = data.tool_name || "";
    const filePath = (data.tool_input && data.tool_input.file_path) || "";

    // Only check file modification tools
    if (!filePath) process.exit(0);
    // Match common tool names across harnesses
    const writeTools = ["Write", "Edit", "StrReplace", "write", "edit", "write_file", "replace"];
    if (!writeTools.includes(toolName)) process.exit(0);

    const root = findProjectRoot();
    // Not a SIFU project
    if (!fs.existsSync(path.resolve(root, "SIFU.dna.md"))) process.exit(0);

    const relPath = path.relative(root, filePath);
    if (!needsDna(relPath)) process.exit(0);

    // Check .dna.md sidecar
    const dnaPath = filePath + ".dna.md";
    if (!fs.existsSync(dnaPath)) {
      console.error(`SIFU BLOCKED: ${relPath}`);
      console.error(`No ${relPath}.dna.md found. Create it first with a [DNA-###] entry.`);
      console.error(`Run /sifu for format guide.`);
      process.exit(2);
    }

    const v = validateDna(dnaPath);
    if (!v.valid) {
      console.error(`SIFU BLOCKED: ${relPath}`);
      console.error(`Invalid .dna.md: ${v.error}`);
      process.exit(2);
    }

    // Soft reminder if .dna.md is stale
    if (fs.existsSync(filePath)) {
      const dnaMtime = fs.statSync(dnaPath).mtimeMs;
      const codeMtime = fs.statSync(filePath).mtimeMs;
      if (dnaMtime < codeMtime) {
        const msg = `SIFU: ${relPath}.dna.md not updated before this change. Append a new [DNA-###] entry at the END first.`;
        if (process.env.CURSOR_PLUGIN_ROOT) {
          console.log(JSON.stringify({ additional_context: msg }));
        } else {
          console.log(JSON.stringify({
            hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: msg },
          }));
        }
      }
    }

    process.exit(0);
  } catch (e) {
    // Fail open
    process.exit(0);
  }
}

main();
