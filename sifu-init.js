#!/usr/bin/env node
/**
 * SIFU Initializer (0.1.0)
 *
 * Installs SIFU DNA-first framework into AI coding projects.
 * Soft enforcement only — installs SKILL, no hooks, no rules injection.
 * Full installer with harness adaptation + ASCII art coming in next release.
 *
 * Usage: node sifu-init.js [--claude|--cursor|--codex|--gemini|...]
 * Zero dependencies.
 */

const fs = require("node:fs");
const path = require("node:path");

const ok = (m) => console.log(`  + ${m}`);
const warn = (m) => console.log(`  ! ${m}`);

// ============================================================
// SKILL TEMPLATE
// ============================================================

function getSkill() {
  return fs.readFileSync(path.join(__dirname, ".claude", "skills", "sifu", "SKILL.md"), "utf-8");
}

// ============================================================
// HARNESS DEFINITIONS
// ============================================================

const HARNESSES = {
  claude:      { dir: ".claude",   skillsDir: ".claude/skills/sifu" },
  cursor:      { dir: ".cursor",   skillsDir: ".cursor/skills/sifu" },
  windsurf:    { dir: ".windsurf", skillsDir: ".windsurf/skills/sifu" },
  codex:       { dir: ".codex",    skillsDir: ".codex/skills/sifu" },
  gemini:      { dir: ".gemini",   skillsDir: ".gemini/skills/sifu" },
  antigravity: { dir: ".agent",    skillsDir: ".agent/skills/sifu" },
  opencode:    { dir: ".opencode", skillsDir: ".opencode/skills/sifu" },
  copilot:     { dir: ".github",   skillsDir: ".github/skills/sifu" },
};

function detect(targetDir) {
  const found = [];
  for (const [name, h] of Object.entries(HARNESSES)) {
    if (fs.existsSync(path.join(targetDir, h.dir))) found.push(name);
  }
  return found.length ? found : ["claude"];
}

// ============================================================
// INSTALL LOGIC
// ============================================================

function installSkill(dir, h, name) {
  const skillDir = path.join(dir, h.skillsDir);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), getSkill());
  ok(`${name}: installed SKILL.md -> ${h.skillsDir}/SKILL.md`);
}

function installSifuIgnore(dir) {
  const ignorePath = path.join(dir, ".sifuignore");
  if (fs.existsSync(ignorePath)) { warn(".sifuignore exists — skip"); return; }
  const src = path.join(__dirname, ".sifuignore");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, ignorePath);
  } else {
    // Inline minimal default if running without repo context
    fs.writeFileSync(ignorePath, [
      "# .sifuignore — Files exempt from DNA sidecar requirement",
      ".git/", ".claude/", ".cursor/", ".codex/", ".opencode/", ".github/", ".gemini/",
      "node_modules/", "dist/", "build/", ".venv/", "__pycache__/",
      "*.lock", "*.pyc", "*.so", "*.dll",
      "*.png", "*.jpg", "*.gif", "*.svg", "*.pdf", "*.zip", "*.woff", "*.mp3", "*.mp4",
      "*.log",
      ".gitignore", ".claudeignore", ".env", ".env.*", "LICENSE", "package-lock.json",
    ].join("\n") + "\n");
  }
  ok("Created .sifuignore");
}

function protectGitIgnore(dir) {
  const giPath = path.join(dir, ".gitignore");
  const dnaRule = "!.*.dna.md";
  const nestedRule = "!**/.*.dna.md";

  let content = "";
  if (fs.existsSync(giPath)) {
    content = fs.readFileSync(giPath, "utf-8");
    if (content.includes(dnaRule)) { warn(".gitignore already has DNA protection — skip"); return; }
  }

  const block = [
    "",
    "# SIFU: ensure hidden .dna.md sidecars are always git-tracked",
    dnaRule,
    nestedRule,
    "",
  ].join("\n");

  fs.writeFileSync(giPath, content.trimEnd() + "\n" + block);
  ok(".gitignore: added DNA sidecar protection (!.*.dna.md)");
}

// ============================================================
// MAIN
// ============================================================

const args = process.argv.slice(2);
const targetDir = process.cwd();
let harnesses = args
  .filter(a => HARNESSES[a.replace("--", "")])
  .map(a => a.replace("--", ""));
if (!harnesses.length) harnesses = detect(targetDir);

console.log("\n  SIFU — DNA-First Framework (0.1.0)\n");
console.log(`  Target: ${targetDir}`);
console.log(`  Harness: ${harnesses.join(", ")}\n`);

installSifuIgnore(targetDir);
protectGitIgnore(targetDir);

for (const name of harnesses) {
  installSkill(targetDir, HARNESSES[name], name);
}

console.log("\n  SIFU initialized. Run /sifu for the DNA guide.\n");
