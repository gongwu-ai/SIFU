#!/usr/bin/env node
/**
 * SIFU CLI (0.1.0)
 *
 * Commands: check, status, new, read, sync, hash
 * Zero dependencies — pure Node.js.
 *
 * DNA format: hidden sidecars `.{filename}.dna.md` with 5-column table.
 * IDs: [DNA-<hash8>] content-addressed via sha256(filepath|timestamp|before_hash).
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// ─── Exemption logic ────────────────────────────────────────────

const EXEMPT_DIRS = new Set([
  ".git", ".claude", ".cursor", ".codex", ".opencode", ".github", ".gemini",
  ".venv", "__pycache__", "node_modules", "dist", "build", ".next", ".nuxt",
  ".windsurf", ".agent",
]);

const EXEMPT_EXTENSIONS = new Set([
  ".lock", ".pyc", ".pyo", ".pyd", ".so", ".dll", ".dylib",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".pdf", ".zip", ".tar", ".gz", ".bz2",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp3", ".mp4", ".wav", ".avi", ".log",
]);

const EXEMPT_FILENAMES = new Set([
  ".gitignore", ".claudeignore", ".env", ".env.local",
  "__init__.py", "LICENSE", "package-lock.json",
]);

/**
 * Determines if a file needs a .dna.md sidecar.
 * @param {string} relPath - path relative to project root
 * @returns {boolean}
 */
function needsDna(relPath) {
  if (relPath.endsWith(".dna.md")) return false;
  const name = path.basename(relPath);
  if (EXEMPT_FILENAMES.has(name)) return false;
  if (EXEMPT_EXTENSIONS.has(path.extname(relPath))) return false;
  const parts = relPath.replace(/\\/g, "/").split("/");
  for (const p of parts) { if (EXEMPT_DIRS.has(p)) return false; }
  return true;
}

/**
 * Returns the hidden .dna.md sidecar path for a given file path.
 * e.g., "src/foo.js" -> "src/.foo.js.dna.md"
 * @param {string} filePath
 * @returns {string}
 */
function dnaPath(filePath) {
  const dir = path.dirname(filePath);
  const name = path.basename(filePath);
  return path.join(dir, `.${name}.dna.md`);
}

// ─── Hash8 DNA ID generation ────────────────────────────────────

/**
 * Generates a content-addressed DNA hash8 ID.
 * @param {string} filePath - relative path to the tracked file
 * @param {string} timestamp - POSIX timestamp string
 * @param {string} beforeHash - sha256 of file content before change (or empty-string hash)
 * @returns {string} 8-char hex hash
 */
function generateHash8(filePath, timestamp, beforeHash) {
  const input = `${filePath}|${timestamp}|${beforeHash}`;
  return crypto.createHash("sha256").update(input).digest("hex").substring(0, 8);
}

/**
 * Computes sha256 of a file's content, or of empty string if file doesn't exist.
 * @param {string} absPath - absolute path to the file
 * @returns {string} hex sha256
 */
function fileHash(absPath) {
  try {
    const content = fs.readFileSync(absPath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return crypto.createHash("sha256").update("").digest("hex");
  }
}

// ─── Walk directory ─────────────────────────────────────────────

function walk(dir, root, results) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory()) {
      if (!EXEMPT_DIRS.has(entry.name)) walk(full, root, results);
      continue;
    }
    if (entry.isFile() && needsDna(rel)) {
      const dna = dnaPath(full);
      results.push({ rel, full, hasDna: fs.existsSync(dna), dnaFull: dna });
    }
  }
  return results;
}

// ─── DNA file parsing ───────────────────────────────────────────

/**
 * Parses a .dna.md file into frontmatter + entries.
 * @param {string} dnaFilePath
 * @returns {{ frontmatter: object, entries: Array<{id,time,agent,act,rationale}> }}
 */
function parseDna(dnaFilePath) {
  const content = fs.readFileSync(dnaFilePath, "utf-8");
  const fm = {};
  const entries = [];

  // Parse frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split("\n")) {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) fm[key.trim()] = rest.join(":").trim();
    }
  }

  // Parse table rows (skip header + separator)
  const lines = content.split("\n");
  let inTable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("| ID")) { inTable = true; continue; }
    if (trimmed.startsWith("|----") || trimmed.startsWith("|-")) { continue; }
    if (inTable && trimmed.startsWith("|")) {
      const cells = trimmed.split("|").map(s => s.trim()).filter(Boolean);
      if (cells.length >= 5) {
        entries.push({
          id: cells[0], time: cells[1], agent: cells[2],
          act: cells[3], rationale: cells[4],
        });
      }
    }
  }

  return { frontmatter: fm, entries };
}

// ─── Commands ───────────────────────────────────────────────────

function cmdCheck() {
  const root = process.cwd();
  const files = walk(root, root, []);
  const missing = files.filter(f => !f.hasDna);
  if (missing.length === 0) {
    console.log(`All ${files.length} files have .dna.md sidecars.`);
  } else {
    console.log(`Missing .dna.md (${missing.length}/${files.length}):\n`);
    for (const f of missing) console.log(`  ${f.rel}`);
    console.log(`\nRun: sifu new <file> to create templates.`);
  }
}

function cmdStatus() {
  const root = process.cwd();
  const files = walk(root, root, []);
  const covered = files.filter(f => f.hasDna).length;
  const total = files.length;
  const pct = total ? Math.round(covered / total * 100) : 100;
  console.log(`DNA coverage: ${covered}/${total} (${pct}%)`);
  if (pct < 100) console.log(`Run: sifu check  for details.`);
}

function cmdNew(file) {
  if (!file) { console.log("Usage: sifu new <file>"); process.exit(1); }
  const absFile = path.resolve(file);
  const root = process.cwd();
  const relFile = path.relative(root, absFile);
  const dna = dnaPath(absFile);

  if (fs.existsSync(dna)) { console.log(`${path.relative(root, dna)} already exists.`); process.exit(0); }

  const ts = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 12) + "+0000";
  const bHash = fileHash(absFile);
  const id = generateHash8(relFile, ts, bHash);

  const content = `---
file: ${relFile}
purpose:
last: ${id} @ ${ts}
entries: 1
---

| ID | Time | Agent | Act | Rationale |
|----|------|-------|-----|-----------|
| ${id} | ${ts} | cli | initial creation | created by sifu new |
`;

  fs.mkdirSync(path.dirname(dna), { recursive: true });
  fs.writeFileSync(dna, content);
  console.log(`Created ${path.relative(root, dna)}`);
  console.log(`  ID: ${id}`);
  console.log(`  Edit 'purpose' and first entry rationale before writing code.`);
}

function cmdRead(file, n) {
  if (!file) { console.log("Usage: sifu read <file> [-n NUM] [--all]"); process.exit(1); }
  const absFile = path.resolve(file);
  const dna = dnaPath(absFile);
  const root = process.cwd();

  if (!fs.existsSync(dna)) {
    console.log(`No .dna.md for ${path.relative(root, absFile)}`);
    process.exit(1);
  }

  const { frontmatter, entries } = parseDna(dna);
  console.log(`--- ${frontmatter.file || path.relative(root, absFile)} ---`);
  if (frontmatter.purpose) console.log(`Purpose: ${frontmatter.purpose}`);
  console.log(`Entries: ${entries.length}\n`);

  const show = n === Infinity ? entries : entries.slice(0, n);
  if (show.length === 0) { console.log("(no entries)"); return; }

  console.log("| ID | Time | Agent | Act | Rationale |");
  console.log("|----|------|-------|-----|-----------|");
  for (const e of show) {
    console.log(`| ${e.id} | ${e.time} | ${e.agent} | ${e.act} | ${e.rationale} |`);
  }
  if (n !== Infinity && entries.length > n) {
    console.log(`\n... ${entries.length - n} more entries. Use --all to see all.`);
  }
}

function cmdSync() {
  const root = process.cwd();
  const files = walk(root, root, []);
  let updated = 0;

  for (const f of files) {
    if (!f.hasDna) continue;
    const content = fs.readFileSync(f.dnaFull, "utf-8");
    const { frontmatter, entries } = parseDna(f.dnaFull);

    if (entries.length === 0) continue;

    const newest = entries[0];
    const expectedLast = `${newest.id} @ ${newest.time}`;
    const expectedEntries = String(entries.length);

    if (frontmatter.last === expectedLast && frontmatter.entries === expectedEntries) continue;

    // Update frontmatter
    let newContent = content;
    if (frontmatter.last !== undefined) {
      newContent = newContent.replace(/^last:.*$/m, `last: ${expectedLast}`);
    } else {
      newContent = newContent.replace(/^(purpose:.*)$/m, `$1\nlast: ${expectedLast}`);
    }
    if (frontmatter.entries !== undefined) {
      newContent = newContent.replace(/^entries:.*$/m, `entries: ${expectedEntries}`);
    } else {
      newContent = newContent.replace(/^(last:.*)$/m, `$1\nentries: ${expectedEntries}`);
    }

    fs.writeFileSync(f.dnaFull, newContent);
    updated++;
  }

  console.log(`Synced frontmatter for ${updated} .dna.md files.`);
}

function cmdHash(file) {
  if (!file) { console.log("Usage: sifu hash <file>"); process.exit(1); }
  const absFile = path.resolve(file);
  const root = process.cwd();
  const relFile = path.relative(root, absFile);
  const ts = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 12) + "+0000";
  const bHash = fileHash(absFile);
  const id = generateHash8(relFile, ts, bHash);
  console.log(`File:      ${relFile}`);
  console.log(`Timestamp: ${ts}`);
  console.log(`Before:    ${bHash.substring(0, 16)}...`);
  console.log(`DNA ID:    ${id}`);
}

// ─── Main ───────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cmd = args[0];

switch (cmd) {
  case "check":  cmdCheck(); break;
  case "status": cmdStatus(); break;
  case "new":    cmdNew(args[1]); break;
  case "read": {
    const file = args[1];
    const allFlag = args.includes("--all");
    const nIdx = args.indexOf("-n");
    const n = allFlag ? Infinity : (nIdx >= 0 ? parseInt(args[nIdx + 1], 10) : 10);
    cmdRead(file, n);
    break;
  }
  case "sync":   cmdSync(); break;
  case "hash":   cmdHash(args[1]); break;
  default:
    console.log("SIFU CLI (0.1.0)\n");
    console.log("  sifu check            List files missing .dna.md");
    console.log("  sifu status           Show DNA coverage stats");
    console.log("  sifu new <file>       Create .dna.md template with hash8 ID");
    console.log("  sifu read <file>      Show top 10 DNA entries (newest first)");
    console.log("  sifu read <f> -n 20   Show top 20 entries");
    console.log("  sifu read <f> --all   Show all entries");
    console.log("  sifu sync             Update frontmatter caches (last, entries)");
    console.log("  sifu hash <file>      Generate a DNA hash8 ID for a file");
}
