#!/usr/bin/env node
/**
 * SIFU CLI (v4)
 *
 * Commands: init, check, status, new <file>
 * Zero dependencies.
 */

const fs = require("node:fs");
const path = require("node:path");

// --- Shared exemption logic (must match dna-enforcer.js) ---

const EXEMPT_DIRS = new Set([
  ".git", ".claude", ".cursor", ".codex", ".opencode", ".github",
  ".venv", "__pycache__", "node_modules", "dist", "build", ".next", ".nuxt",
]);
const EXEMPT_EXTENSIONS = new Set([
  ".lock", ".pyc", ".pyo", ".pyd", ".so", ".dll", ".dylib",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".pdf", ".zip", ".tar", ".gz", ".bz2",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp3", ".mp4", ".wav", ".avi", ".log",
]);
const EXEMPT_FILENAMES = new Set([
  "SIFU.dna.md", ".gitignore", ".claudeignore", ".env", ".env.local",
  "__init__.py", "LICENSE",
]);

function needsDna(relPath) {
  if (relPath.endsWith(".dna.md")) return false;
  const name = path.basename(relPath);
  if (EXEMPT_FILENAMES.has(name)) return false;
  if (EXEMPT_EXTENSIONS.has(path.extname(relPath))) return false;
  const parts = relPath.replace(/\\/g, "/").split("/");
  for (const p of parts) { if (EXEMPT_DIRS.has(p)) return false; }
  return true;
}

// --- Walk directory ---

function walk(dir, root, results) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    // Skip exempt dirs early
    if (entry.isDirectory()) {
      if (!EXEMPT_DIRS.has(entry.name)) walk(full, root, results);
      continue;
    }
    if (entry.isFile() && needsDna(rel)) {
      const hasDna = fs.existsSync(full + ".dna.md");
      results.push({ rel, hasDna });
    }
  }
  return results;
}

// --- Commands ---

function cmdInit() {
  // Delegate to sifu-init.js
  const initScript = path.join(__dirname, "sifu-init.js");
  require("node:child_process").execSync(`node "${initScript}" ${process.argv.slice(3).join(" ")}`, {
    stdio: "inherit", cwd: process.cwd()
  });
}

function cmdCheck() {
  const root = process.cwd();
  if (!fs.existsSync(path.join(root, "SIFU.dna.md"))) {
    console.log("Not a SIFU project (no SIFU.dna.md). Run: node sifu-cli.js init");
    process.exit(1);
  }
  const files = walk(root, root, []);
  const missing = files.filter(f => !f.hasDna);
  if (missing.length === 0) {
    console.log(`All ${files.length} files have .dna.md sidecars.`);
  } else {
    console.log(`Missing .dna.md (${missing.length}/${files.length}):\n`);
    for (const f of missing) console.log(`  ${f.rel}`);
    console.log(`\nRun: node sifu-cli.js new <file> to create templates.`);
  }
}

function cmdStatus() {
  const root = process.cwd();
  if (!fs.existsSync(path.join(root, "SIFU.dna.md"))) {
    console.log("Not a SIFU project."); process.exit(1);
  }
  const files = walk(root, root, []);
  const covered = files.filter(f => f.hasDna).length;
  const total = files.length;
  const pct = total ? Math.round(covered / total * 100) : 100;
  console.log(`DNA coverage: ${covered}/${total} (${pct}%)`);
  if (pct < 100) {
    console.log(`Run: node sifu-cli.js check  for details.`);
  }
}

function cmdNew(file) {
  if (!file) { console.log("Usage: node sifu-cli.js new <file>"); process.exit(1); }
  const dnaPath = file + ".dna.md";
  if (fs.existsSync(dnaPath)) { console.log(`${dnaPath} already exists.`); process.exit(0); }
  const relFile = path.relative(process.cwd(), path.resolve(file));
  const content = `---\nfile: ${relFile}\n---\n\n`;
  fs.mkdirSync(path.dirname(dnaPath), { recursive: true });
  fs.writeFileSync(dnaPath, content);
  console.log(`Created ${dnaPath} — add a [DNA-###] entry before writing code.`);
}

// --- Main ---

const cmd = process.argv[2];
switch (cmd) {
  case "init": cmdInit(); break;
  case "check": cmdCheck(); break;
  case "status": cmdStatus(); break;
  case "new": cmdNew(process.argv[3]); break;
  default:
    console.log("SIFU CLI\n");
    console.log("  node sifu-cli.js init             Initialize SIFU");
    console.log("  node sifu-cli.js check            List files missing .dna.md");
    console.log("  node sifu-cli.js status           Show DNA coverage");
    console.log("  node sifu-cli.js new <file>       Create .dna.md template");
}
