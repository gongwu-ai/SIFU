#!/usr/bin/env node
/**
 * SIFU Initializer (v4)
 *
 * Injects SIFU DNA-first framework into any AI coding project.
 * All templates inlined — no external files needed.
 * Detects harness, adapts hook matcher and rules file.
 * Merges with existing config — never overwrites.
 *
 * Usage: node sifu-init.js [--claude|--cursor|--codex|--opencode|--copilot|--gemini]
 * Zero dependencies.
 */

const fs = require("node:fs");
const path = require("node:path");

const ok = (m) => console.log(`  + ${m}`);
const warn = (m) => console.log(`  ! ${m}`);

// ============================================================
// TEMPLATES (inlined, OpenSpec-style)
// ============================================================

function getSifuDna() {
  return `---
type: registry
---

# SIFU.dna.md — Global DNA Registry

> Append-only. New entries at END. To invalidate old decisions, append a new entry explaining why.

- [DNA-001] DNA-first: decision rationale before implementation, always
- [DNA-002] Phenotype disposable: code can be deleted and regenerated from DNA
- [DNA-003] Wrong is OK: bad DNA can exist, append correction, never delete
- [DNA-004] Append-only: new entries at END of file, no prepend, no insert, no delete, no edit
- [DNA-005] 宁滥勿缺: when in doubt, write the rationale
`;
}

function getClaudeInject() {
  return `<!-- SIFU:BEGIN -->

## SIFU: DNA-First Framework

Every authored file has a \`.dna.md\` sidecar recording WHAT changed and WHY. Code is disposable; decision rationale persists.

- Before editing any file, append a new DNA entry to its \`.dna.md\` first. **BINDING**.
- \`.dna.md\` is append-only: new entries at **END** of file only. Never prepend, insert, delete, or edit existing entries. **BINDING**.
- Each modification = new \`[DNA-{NNN}]\` ID. Never reuse an existing ID. Register in \`SIFU.dna.md\` first. **BINDING**.
- Timestamp: run \`date +%Y%m%d%H%M%z\` — do not fabricate. **BINDING**.
- \`.dna.md\` frontmatter: \`---\\nfile: {path}\\n---\` then DNA entries below.
- Entry format: \`- [DNA-{NNN}] {timestamp} / {agent}: {what + why in one line}\`
- These rules apply to ALL agents, subagents, and frameworks. **BINDING**.
- \`/sifu\` skill has the full format guide. A PreToolUse hook enforces write-gating.

<!-- SIFU:END -->
`;
}

function getSkill() {
  return `---
name: sifu
description: "SIFU DNA-first guide. Format reference, workflow, exemptions, and CLI commands."
user-invocable: true
---

# SIFU — DNA-First Development Guide

## DNA Entry Format

One line per entry. Append at END of file only.

\`\`\`
- [DNA-{NNN}] {timestamp} / {agent}: {what + why}
\`\`\`

Example:
\`\`\`
- [DNA-006] 202603291402+0800 / main: simplified DNA to one-line format, old two-section structure caused agent ordering mistakes
\`\`\`

- \`[DNA-{NNN}]\` — globally unique ID, registered in \`SIFU.dna.md\`
- Timestamp — run \`date +%Y%m%d%H%M%z\` to get real time. Never fabricate.
- Every modification = brand new DNA ID. Never reuse an existing ID, even for the same file. Two edits to the same file = two different IDs.
- To deprecate: append new entry like \`deprecated [DNA-003] because...\`. Don't touch original.

## .dna.md File

Every authored file gets a \`.dna.md\` sidecar next to it:

\`\`\`
sifu-init.js         <- code
sifu-init.js.dna.md  <- DNA (append-only)
\`\`\`

Frontmatter:
\`\`\`yaml
---
file: sifu-init.js
---
\`\`\`

Then DNA entries, one per line, appended at END:
\`\`\`
- [DNA-006] 202603291402+0800 / main: simplified DNA to one-line format, old two-section structure caused ordering mistakes
- [DNA-007] 202603291530+0800 / main: added multi-harness support, different harnesses use different tool names
\`\`\`

## SIFU.dna.md (Global Registry)

At project root. All DNA IDs registered here. One line per ID, append at END.

Register here FIRST, then reference in \`.dna.md\` files.

## Workflow

1. Run \`date +%Y%m%d%H%M%z\` — get real timestamp
2. Pick next DNA ID number (check SIFU.dna.md for latest)
3. Append \`- [DNA-{NNN}] {description}\` to END of \`SIFU.dna.md\`
4. Append \`- [DNA-{NNN}] {timestamp} / {agent}: {what + why}\` to END of \`{file}.dna.md\`
5. Now edit the code file

For new files: create \`{file}.dna.md\` with frontmatter + first entry BEFORE creating the code file.

## Append-Only Rules

- New entries go at END of file. Always.
- Never prepend (add before existing entries).
- Never insert in the middle.
- Never delete any entry.
- Never modify existing entries.
- When using Edit tool: match the LAST line of the file, put new content AFTER it.

## Exempt Files (no .dna.md needed)

Only auto-generated, binary, and tool-internal files are exempt:

**Directories:** \`.git/\`, \`.claude/\`, \`.cursor/\`, \`.codex/\`, \`.opencode/\`, \`.github/\`, \`.venv/\`, \`__pycache__/\`, \`node_modules/\`, \`dist/\`, \`build/\`

**Extensions:** \`.lock\`, \`.pyc\`, \`.so\`, \`.dll\`, \`.png\`, \`.jpg\`, \`.gif\`, \`.svg\`, \`.pdf\`, \`.zip\`, \`.tar\`, \`.gz\`, \`.woff\`, \`.mp3\`, \`.mp4\`, \`.log\`

**Filenames:** \`SIFU.dna.md\`, \`.gitignore\`, \`.claudeignore\`, \`.env\`, \`__init__.py\`, \`LICENSE\`

**Everything else needs DNA** — including \`.py\`, \`.js\`, \`.ts\`, \`.go\`, \`.rs\`, \`.sh\`, \`.md\`, \`.json\`, \`.yaml\`, \`.toml\`, \`.txt\`, \`.cfg\`, \`.csv\`, config files, documentation, scripts.

## CLI Commands

\`\`\`bash
node sifu-cli.js init             # Initialize SIFU in current project
node sifu-cli.js check            # List files missing .dna.md
node sifu-cli.js status           # Show DNA coverage stats
node sifu-cli.js new <file>       # Generate .dna.md template for a file
\`\`\`
`;
}

function getHook() {
  // Read from .claude/hooks/ if available (for plugin mode), otherwise inline
  const hookPath = path.join(__dirname, ".claude", "hooks", "dna-enforcer.js");
  if (fs.existsSync(hookPath)) return fs.readFileSync(hookPath, "utf-8");
  // Fallback: tell user to get hook from repo
  throw new Error("dna-enforcer.js not found. Clone the full SIFU repo.");
}

// ============================================================
// HARNESS DEFINITIONS
// ============================================================

const HARNESSES = {
  claude:      { dir: ".claude",   rules: "CLAUDE.md",                hooks: true,  matcher: "Write|Edit" },
  cursor:      { dir: ".cursor",   rules: ".cursor/rules/sifu.md",    hooks: true,  matcher: "Write|StrReplace", camelCase: true },
  windsurf:    { dir: ".windsurf", rules: ".windsurf/rules/sifu.md",  hooks: true,  matcher: "Write|StrReplace", camelCase: true },
  codex:       { dir: ".codex",    rules: "AGENTS.md",                hooks: true,  matcher: "Write|Edit" },
  opencode:    { dir: ".opencode", rules: "AGENTS.md",                hooks: false },
  copilot:     { dir: ".github",   rules: "copilot-instructions.md",  hooks: false },
  gemini:      { dir: ".gemini",   rules: "GEMINI.md",                hooks: true,  matcher: "write_file|replace" },
  antigravity: { dir: ".agent",    rules: "GEMINI.md",                hooks: true,  matcher: "write_file|replace" },
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

function initDna(dir) {
  const p = path.join(dir, "SIFU.dna.md");
  if (fs.existsSync(p)) { warn("SIFU.dna.md exists — skip"); return; }
  fs.writeFileSync(p, getSifuDna());
  ok("Created SIFU.dna.md");
}

function initSkill(dir, h) {
  const skillDir = path.join(dir, h.dir, "skills", "sifu");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), getSkill());
  ok(`Created ${h.dir}/skills/sifu/SKILL.md`);
}

function initHook(dir, h) {
  if (!h.hooks) { warn(`${h.dir}: no hook support — rules only`); return; }
  const hookDir = path.join(dir, h.dir, "hooks");
  fs.mkdirSync(hookDir, { recursive: true });
  fs.writeFileSync(path.join(hookDir, "dna-enforcer.js"), getHook());
  ok(`Created ${h.dir}/hooks/dna-enforcer.js`);
}

function mergeSettings(dir, h) {
  if (!h.hooks) return;
  const settingsPath = path.join(dir, h.dir, "settings.json");
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8")); } catch { settings = {}; }
  }
  if (!settings.hooks) settings.hooks = {};

  const event = h.camelCase ? "preToolUse" : "PreToolUse";
  if (!settings.hooks[event]) settings.hooks[event] = [];

  const cmd = `node ${h.dir}/hooks/dna-enforcer.js`;
  const already = settings.hooks[event].some(e => {
    const hooks = e.hooks || [];
    return (e.command && e.command.includes("dna-enforcer")) ||
           hooks.some(x => x.command && x.command.includes("dna-enforcer"));
  });
  if (already) { warn("Hook already registered — skip"); return; }

  if (h.camelCase) {
    settings.hooks[event].push({ command: cmd });
  } else {
    settings.hooks[event].push({
      matcher: h.matcher,
      hooks: [{ type: "command", command: cmd, timeout: 5000 }]
    });
  }
  fs.mkdirSync(path.join(dir, h.dir), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
  ok(`Registered hook in ${h.dir}/settings.json (matcher: ${h.matcher})`);
}

function injectRules(dir, h) {
  const inject = getClaudeInject();
  const rulesPath = path.join(dir, h.rules);
  fs.mkdirSync(path.dirname(rulesPath), { recursive: true });

  if (!fs.existsSync(rulesPath)) {
    fs.writeFileSync(rulesPath, inject);
    ok(`Created ${h.rules}`);
    return;
  }
  let content = fs.readFileSync(rulesPath, "utf-8");
  if (content.includes("<!-- SIFU:BEGIN -->")) {
    content = content.replace(/<!-- SIFU:BEGIN -->[\s\S]*?<!-- SIFU:END -->/, inject.trim());
    fs.writeFileSync(rulesPath, content);
    ok(`Updated SIFU rules in ${h.rules}`);
  } else {
    fs.writeFileSync(rulesPath, content.trimEnd() + "\n\n" + inject);
    ok(`Appended SIFU rules to ${h.rules}`);
  }
}

// ============================================================
// MAIN
// ============================================================

const args = process.argv.slice(2);
const targetDir = process.cwd();
let harnesses = args.filter(a => HARNESSES[a.replace("--", "")]).map(a => a.replace("--", ""));
if (!harnesses.length) harnesses = detect(targetDir);

console.log("\nSIFU — DNA-First Framework\n");
console.log(`  Target: ${targetDir}`);
console.log(`  Harness: ${harnesses.join(", ")}\n`);

initDna(targetDir);
for (const name of harnesses) {
  const h = HARNESSES[name];
  console.log(`  --- ${name} ---`);
  initSkill(targetDir, h);
  initHook(targetDir, h);
  mergeSettings(targetDir, h);
  injectRules(targetDir, h);
}

console.log("\n  SIFU initialized. DNA-first enforcement active.");
console.log("  Run /sifu for the full DNA guide.\n");
