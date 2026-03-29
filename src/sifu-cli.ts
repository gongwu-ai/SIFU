/**
 * SIFU CLI (0.2.0)
 *
 * Commands: check, status, new, read, sync, hash
 * Zero dependencies — pure Node.js.
 *
 * DNA format: hidden sidecars `.{filename}.dna.md` with 5-column table.
 * IDs: [DNA-<hash8>] content-addressed via sha256(filepath|timestamp|before_hash).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ─── Types ─────────────────────────────────────────────────────

interface DnaEntry {
  id: string;
  time: string;
  agent: string;
  act: string;
  rationale: string;
}

interface Frontmatter {
  file?: string;
  purpose?: string;
  last?: string;
  entries?: string;
  [key: string]: string | undefined;
}

interface Exemptions {
  dirs: Set<string>;
  extensions: Set<string>;
  filenames: Set<string>;
  prefixes: string[];
}

interface WalkResult {
  rel: string;
  full: string;
  hasDna: boolean;
  dnaFull: string;
}

interface SafePathResult {
  absFile: string;
  relFile: string;
  root: string;
}

interface ParsedDna {
  frontmatter: Frontmatter;
  entries: DnaEntry[];
}

// ─── Exemption logic ────────────────────────────────────────────

// Hardcoded fallback (used when .sifuignore is absent)
const DEFAULT_EXEMPT_DIRS: Set<string> = new Set([
  ".git", ".claude", ".cursor", ".codex", ".opencode", ".github", ".gemini",
  ".venv", "__pycache__", "node_modules", "dist", "build", ".next", ".nuxt",
  ".windsurf", ".agent",
]);
const DEFAULT_EXEMPT_EXTENSIONS: Set<string> = new Set([
  ".lock", ".pyc", ".pyo", ".pyd", ".so", ".dll", ".dylib",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".pdf", ".zip", ".tar", ".gz", ".bz2",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp3", ".mp4", ".wav", ".avi", ".log",
]);
const DEFAULT_EXEMPT_FILENAMES: Set<string> = new Set([
  ".gitignore", ".claudeignore", ".env", ".env.local",
  "__init__.py", "LICENSE", "package-lock.json",
]);

// Always exempt — cannot be overridden even if .sifuignore is missing
const ALWAYS_EXEMPT: Set<string> = new Set([".sifuignore"]);

/**
 * Parses a .sifuignore file into { dirs, extensions, filenames, prefixes } sets.
 * Simplified .gitignore-like syntax (# comments, blank lines ignored).
 *   - Lines ending with `/`         -> directory exemptions
 *   - Lines starting with `*.`      -> extension exemptions
 *   - Lines with `*` elsewhere      -> prefix glob (e.g. `.env.*` matches `.env.prod`)
 *   - Everything else               -> exact filename exemptions
 * @param content - raw .sifuignore file content
 * @returns parsed exemption rules
 */
function parseSifuIgnore(content: string): Exemptions {
  const dirs = new Set<string>();
  const extensions = new Set<string>();
  const filenames = new Set<string>();
  const prefixes: string[] = [];
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.endsWith("/")) {
      dirs.add(line.slice(0, -1));
    } else if (line.startsWith("*.")) {
      extensions.add("." + line.slice(2));
    } else if (line.includes("*")) {
      // Prefix glob: ".env.*" matches ".env.prod", ".env.local", etc.
      const prefix = line.substring(0, line.indexOf("*"));
      prefixes.push(prefix);
    } else {
      filenames.add(line);
    }
  }
  return { dirs, extensions, filenames, prefixes };
}

/**
 * Loads exemption rules. Reads .sifuignore if present, otherwise uses hardcoded defaults.
 * @param root - project root directory
 * @returns parsed exemption rules
 */
function loadExemptions(root: string): Exemptions {
  const ignorePath = path.join(root, ".sifuignore");
  try {
    const content = fs.readFileSync(ignorePath, "utf-8");
    return parseSifuIgnore(content);
  } catch {
    return {
      dirs: DEFAULT_EXEMPT_DIRS,
      extensions: DEFAULT_EXEMPT_EXTENSIONS,
      filenames: DEFAULT_EXEMPT_FILENAMES,
      prefixes: [".env."],
    };
  }
}

// Lazy-loaded per invocation
let _exemptions: Exemptions | null = null;
function getExemptions(): Exemptions {
  if (!_exemptions) _exemptions = loadExemptions(process.cwd());
  return _exemptions;
}

/**
 * Determines if a file needs a .dna.md sidecar.
 * @param relPath - path relative to project root
 * @returns true if the file needs a DNA sidecar
 */
function needsDna(relPath: string): boolean {
  if (relPath.endsWith(".dna.md")) return false;
  const name = path.basename(relPath);
  if (ALWAYS_EXEMPT.has(name)) return false;
  const ex = getExemptions();
  if (ex.filenames.has(name)) return false;
  if (ex.extensions.has(path.extname(relPath))) return false;
  if (ex.prefixes && ex.prefixes.some((p) => name.startsWith(p))) return false;
  const parts = relPath.replace(/\\/g, "/").split("/");
  for (const p of parts) { if (ex.dirs.has(p)) return false; }
  return true;
}

/**
 * Returns the hidden .dna.md sidecar path for a given file path.
 * e.g., "src/foo.js" -> "src/.foo.js.dna.md"
 * @param filePath - path to the source file
 * @returns path to the corresponding DNA sidecar
 */
function dnaPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const name = path.basename(filePath);
  return path.join(dir, `.${name}.dna.md`);
}

// ─── Path safety ────────────────────────────────────────────────

/**
 * Resolves a file path, validates it is within the project root,
 * and returns { absFile, relFile } with POSIX-normalized relFile.
 * Exits with error if path escapes project root.
 * @param file - user-provided file path
 * @returns resolved path info
 */
function safePath(file: string): SafePathResult {
  const root = process.cwd();
  const absFile = path.resolve(file);
  const relFile = path.relative(root, absFile).replace(/\\/g, "/");
  if (relFile.startsWith("..")) {
    console.error(`Error: path escapes project root: ${file}`);
    process.exit(1);
  }
  return { absFile, relFile, root };
}

// ─── Hash8 DNA ID generation ────────────────────────────────────

/**
 * Generates a content-addressed DNA hash8 ID.
 * @param filePath - relative path to the tracked file
 * @param timestamp - POSIX timestamp string
 * @param beforeHash - sha256 of file content before change (or empty-string hash)
 * @returns 8-char hex hash
 */
function generateHash8(filePath: string, timestamp: string, beforeHash: string): string {
  const input = `${filePath}|${timestamp}|${beforeHash}`;
  return crypto.createHash("sha256").update(input).digest("hex").substring(0, 8);
}

/**
 * Computes sha256 of a file's content, or of empty string if file doesn't exist.
 * @param absPath - absolute path to the file
 * @returns hex sha256
 */
function fileHash(absPath: string): string {
  try {
    const content = fs.readFileSync(absPath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return crypto.createHash("sha256").update("").digest("hex");
  }
}

// ─── Walk directory ─────────────────────────────────────────────

function walk(dir: string, root: string, results: WalkResult[]): WalkResult[] {
  const ex = getExemptions();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (entry.isDirectory()) {
      if (!ex.dirs.has(entry.name)) walk(full, root, results);
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
 * @param dnaFilePath - path to the DNA sidecar file
 * @returns parsed frontmatter and entry list
 */
function parseDna(dnaFilePath: string): ParsedDna {
  const content = fs.readFileSync(dnaFilePath, "utf-8");
  const fm: Frontmatter = {};
  const entries: DnaEntry[] = [];

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
      const cells = trimmed.split("|").map((s) => s.trim()).filter(Boolean);
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

function cmdCheck(strict: boolean): void {
  const root = process.cwd();
  const files = walk(root, root, []);
  const missing = files.filter((f) => !f.hasDna);
  if (missing.length === 0) {
    console.log(`All ${files.length} files have .dna.md sidecars.`);
  } else {
    console.log(`Missing .dna.md (${missing.length}/${files.length}):\n`);
    for (const f of missing) console.log(`  ${f.rel}`);
    console.log(`\nRun: sifu new <file> to create templates.`);
    if (strict) process.exit(1);
  }
}

function cmdStatus(): void {
  const root = process.cwd();
  const files = walk(root, root, []);
  const covered = files.filter((f) => f.hasDna).length;
  const total = files.length;
  const pct = total ? Math.round(covered / total * 100) : 100;
  console.log(`DNA coverage: ${covered}/${total} (${pct}%)`);
  if (pct < 100) console.log(`Run: sifu check  for details.`);
}

function cmdNew(file: string | undefined): void {
  if (!file) { console.log("Usage: sifu new <file>"); process.exit(1); }
  const { absFile, relFile, root } = safePath(file);
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

function cmdRead(file: string | undefined, n: number): void {
  if (!file) { console.log("Usage: sifu read <file> [-n NUM] [--all]"); process.exit(1); }
  const { absFile, root } = safePath(file);
  const dna = dnaPath(absFile);

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

function cmdSync(): void {
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

function cmdHash(file: string | undefined): void {
  if (!file) { console.log("Usage: sifu hash <file>"); process.exit(1); }
  const { absFile, relFile } = safePath(file);
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
  case "init": {
    const initScript = path.join(__dirname, "sifu-init.js");
    require("node:child_process").execSync(
      `node "${initScript}" ${args.slice(1).join(" ")}`,
      { stdio: "inherit", cwd: process.cwd() }
    );
    break;
  }
  case "check":  cmdCheck(args.includes("--strict")); break;
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
    console.log("SIFU CLI (0.2.0)\n");
    console.log("  sifu init             Install SIFU in current project");
    console.log("  sifu check            List files missing .dna.md");
    console.log("  sifu status           Show DNA coverage stats");
    console.log("  sifu new <file>       Create .dna.md template with hash8 ID");
    console.log("  sifu read <file>      Show top 10 DNA entries (newest first)");
    console.log("  sifu read <f> -n 20   Show top 20 entries");
    console.log("  sifu read <f> --all   Show all entries");
    console.log("  sifu sync             Update frontmatter caches (last, entries)");
    console.log("  sifu hash <file>      Generate a DNA hash8 ID for a file");
}
