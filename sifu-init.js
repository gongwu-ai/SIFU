#!/usr/bin/env node
/**
 * SIFU Initializer (v5)
 *
 * Installs SIFU DNA-first framework into AI coding projects.
 * Soft enforcement only — installs SKILL, no hooks, no rules injection.
 * Full installer with harness adaptation + ASCII art coming in v5.1.
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

// ============================================================
// MAIN
// ============================================================

const args = process.argv.slice(2);
const targetDir = process.cwd();
let harnesses = args
  .filter(a => HARNESSES[a.replace("--", "")])
  .map(a => a.replace("--", ""));
if (!harnesses.length) harnesses = detect(targetDir);

console.log("\n  SIFU — DNA-First Framework (v5)\n");
console.log(`  Target: ${targetDir}`);
console.log(`  Harness: ${harnesses.join(", ")}\n`);

for (const name of harnesses) {
  installSkill(targetDir, HARNESSES[name], name);
}

console.log("\n  SIFU initialized. Run /sifu for the DNA guide.\n");
