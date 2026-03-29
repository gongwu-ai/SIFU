#!/usr/bin/env node
/**
 * SIFU Initializer (0.1.0)
 *
 * Installs SIFU DNA-first framework into AI coding projects.
 * Auto-detects harnesses, installs SKILL, creates .sifuignore,
 * protects .gitignore for hidden DNA sidecars.
 *
 * Usage:
 *   npx sifu-init                          # auto-detect
 *   npx sifu-init --claude --cursor        # explicit harnesses
 *   npx sifu-init --all                    # install all
 *
 * Zero dependencies.
 */

const fs = require("node:fs");
const path = require("node:path");

// ============================================================
// ASCII ART + DISPLAY
// ============================================================

const BANNER = `
   ____  ___ _____  __  __
  / ___|/_ _|  ___||  |  |
  \\___ \\ | || |_   |  |  |
   ___) || ||  _|  |  \\__/
  |____/|___|_|     \\____/

  DNA-First Framework for Agentic Development
  一日为师，终身为师
`;

const ok  = (m) => console.log(`  \x1b[32m+\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const info = (m) => console.log(`  \x1b[36m>\x1b[0m ${m}`);

function printBanner() {
  console.log(`\x1b[36m${BANNER}\x1b[0m`);
}

function printSummary(targetDir, harnesses, actions) {
  console.log("");
  console.log("  \x1b[1m┌─────────────────────────────────────────┐\x1b[0m");
  console.log("  \x1b[1m│\x1b[0m  SIFU Initialized                       \x1b[1m│\x1b[0m");
  console.log("  \x1b[1m├─────────────────────────────────────────┤\x1b[0m");
  console.log(`  \x1b[1m│\x1b[0m  Target:    ${targetDir.slice(-30).padEnd(28)}\x1b[1m│\x1b[0m`);
  console.log(`  \x1b[1m│\x1b[0m  Harnesses: ${harnesses.join(", ").slice(0, 28).padEnd(28)}\x1b[1m│\x1b[0m`);
  console.log(`  \x1b[1m│\x1b[0m  Actions:   ${String(actions).padEnd(28)}\x1b[1m│\x1b[0m`);
  console.log("  \x1b[1m├─────────────────────────────────────────┤\x1b[0m");
  console.log("  \x1b[1m│\x1b[0m                                         \x1b[1m│\x1b[0m");
  console.log("  \x1b[1m│\x1b[0m  Next steps:                            \x1b[1m│\x1b[0m");
  console.log("  \x1b[1m│\x1b[0m    1. Run /sifu for the DNA guide       \x1b[1m│\x1b[0m");
  console.log("  \x1b[1m│\x1b[0m    2. Run sifu check for coverage       \x1b[1m│\x1b[0m");
  console.log("  \x1b[1m│\x1b[0m    3. Run sifu new <file> to start      \x1b[1m│\x1b[0m");
  console.log("  \x1b[1m│\x1b[0m                                         \x1b[1m│\x1b[0m");
  console.log("  \x1b[1m└─────────────────────────────────────────┘\x1b[0m");
  console.log("");
}

// ============================================================
// SKILL TEMPLATE
// ============================================================

function getSkill() {
  const localSkill = path.join(__dirname, ".claude", "skills", "sifu", "SKILL.md");
  if (fs.existsSync(localSkill)) return fs.readFileSync(localSkill, "utf-8");
  throw new Error("SKILL.md not found. Clone the full SIFU repo.");
}

// ============================================================
// HARNESS DEFINITIONS
// ============================================================

const HARNESSES = {
  claude:      { dir: ".claude",    skillsDir: "skills/sifu",  desc: "Claude Code" },
  cursor:      { dir: ".cursor",    skillsDir: "skills/sifu",  desc: "Cursor" },
  windsurf:    { dir: ".windsurf",  skillsDir: "skills/sifu",  desc: "Windsurf" },
  codex:       { dir: ".codex",     skillsDir: "skills/sifu",  desc: "OpenAI Codex" },
  gemini:      { dir: ".gemini",    skillsDir: "skills/sifu",  desc: "Gemini CLI" },
  antigravity: { dir: ".agent",     skillsDir: "skills/sifu",  desc: "Antigravity" },
  opencode:    { dir: ".opencode",  skillsDir: "skills/sifu",  desc: "OpenCode" },
  copilot:     { dir: ".github",    skillsDir: "skills/sifu",  desc: "GitHub Copilot" },
  cline:       { dir: ".cline",     skillsDir: "skills/sifu",  desc: "Cline" },
  roocode:     { dir: ".roo",       skillsDir: "skills/sifu",  desc: "RooCode" },
  kiro:        { dir: ".kiro",      skillsDir: "skills/sifu",  desc: "Kiro" },
};

/**
 * Auto-detect installed harnesses by checking for their config directories.
 * @param {string} targetDir
 * @returns {string[]} harness names
 */
function detect(targetDir) {
  const found = [];
  for (const [name, h] of Object.entries(HARNESSES)) {
    if (fs.existsSync(path.join(targetDir, h.dir))) found.push(name);
  }
  return found;
}

function printDetection(targetDir) {
  console.log("  Scanning for harnesses...\n");
  const all = Object.entries(HARNESSES);
  for (const [name, h] of all) {
    const exists = fs.existsSync(path.join(targetDir, h.dir));
    const icon = exists ? "\x1b[32m●\x1b[0m" : "\x1b[90m○\x1b[0m";
    const label = exists ? `\x1b[1m${h.desc}\x1b[0m` : `\x1b[90m${h.desc}\x1b[0m`;
    console.log(`    ${icon} ${label.padEnd(40)} ${exists ? h.dir + "/" : ""}`);
  }
  console.log("");
}

// ============================================================
// INSTALL LOGIC
// ============================================================

function installSkill(dir, harnessName) {
  const h = HARNESSES[harnessName];
  const skillDir = path.join(dir, h.dir, h.skillsDir);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), getSkill());
  ok(`${h.desc}: SKILL.md -> ${h.dir}/${h.skillsDir}/SKILL.md`);
  return 1;
}

function installSifuIgnore(dir) {
  const ignorePath = path.join(dir, ".sifuignore");
  if (fs.existsSync(ignorePath)) { warn(".sifuignore exists — skip"); return 0; }
  const src = path.join(__dirname, ".sifuignore");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, ignorePath);
  } else {
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
  return 1;
}

function protectGitIgnore(dir) {
  const giPath = path.join(dir, ".gitignore");
  const dnaRule = "!.*.dna.md";
  const nestedRule = "!**/.*.dna.md";

  let content = "";
  if (fs.existsSync(giPath)) {
    content = fs.readFileSync(giPath, "utf-8");
    if (content.includes(dnaRule)) { warn(".gitignore DNA protection exists — skip"); return 0; }
  }

  const block = [
    "",
    "# SIFU: ensure hidden .dna.md sidecars are always git-tracked",
    dnaRule,
    nestedRule,
    "",
  ].join("\n");

  fs.writeFileSync(giPath, content.trimEnd() + "\n" + block);
  ok(".gitignore: added DNA sidecar protection");
  return 1;
}

// ============================================================
// MAIN
// ============================================================

const args = process.argv.slice(2);
const targetDir = process.cwd();
const installAll = args.includes("--all");

printBanner();

// Determine harnesses
let harnesses;
if (installAll) {
  harnesses = Object.keys(HARNESSES);
  info(`Installing for ALL ${harnesses.length} harnesses`);
} else {
  const explicit = args
    .filter(a => HARNESSES[a.replace(/^--/, "")])
    .map(a => a.replace(/^--/, ""));
  if (explicit.length) {
    harnesses = explicit;
    info(`Installing for: ${harnesses.join(", ")}`);
  } else {
    printDetection(targetDir);
    harnesses = detect(targetDir);
    if (!harnesses.length) {
      harnesses = ["claude"];
      info("No harnesses detected — defaulting to Claude Code");
    } else {
      info(`Detected: ${harnesses.join(", ")}`);
    }
  }
}

console.log(`  Target: ${targetDir}\n`);

let actions = 0;
actions += installSifuIgnore(targetDir);
actions += protectGitIgnore(targetDir);

for (const name of harnesses) {
  actions += installSkill(targetDir, name);
}

printSummary(targetDir, harnesses, actions);
