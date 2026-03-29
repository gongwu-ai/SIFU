/**
 * SIFU CLI (0.3.0)
 *
 * Commands: log, deprecate, check, status, new, read, sync, hash, init
 * Zero dependencies — pure Node.js.
 *
 * DNA format: hidden sidecars `.{filename}.dna.md` with 5-column table.
 * IDs: hash8 content-addressed via sha256(filepath|timestamp|before_hash).
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
      const prefix = line.substring(0, line.indexOf("*"));
      prefixes.push(prefix);
    } else {
      filenames.add(line);
    }
  }
  return { dirs, extensions, filenames, prefixes };
}

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

let _exemptions: Exemptions | null = null;
function getExemptions(): Exemptions {
  if (!_exemptions) _exemptions = loadExemptions(process.cwd());
  return _exemptions;
}

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

function dnaPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const name = path.basename(filePath);
  return path.join(dir, `.${name}.dna.md`);
}

// ─── Path safety ────────────────────────────────────────────────

function safePath(file: string): SafePathResult {
  const root = process.cwd();
  const absFile = path.resolve(file);
  const relFile = path.relative(root, absFile).replace(/\\/g, "/");
  if (relFile.startsWith("../") || relFile === "..") {
    console.error(`Error: path escapes project root: ${file}`);
    process.exit(1);
  }
  if (relFile.endsWith(".dna.md")) {
    console.error(`Error: cannot target .dna.md files directly: ${file}`);
    process.exit(1);
  }
  try {
    const stat = fs.lstatSync(absFile);
    if (stat.isDirectory()) {
      console.error(`Error: target is a directory: ${file}`);
      process.exit(1);
    }
    if (stat.isSymbolicLink()) {
      const real = fs.realpathSync(absFile);
      const realRel = path.relative(root, real);
      if (realRel.startsWith("..")) {
        console.error(`Error: symlink resolves outside project root: ${file}`);
        process.exit(1);
      }
    }
  } catch {
    // File doesn't exist yet — OK for new files
  }
  return { absFile, relFile, root };
}

// ─── Hash8 DNA ID generation ────────────────────────────────────

function generateHash8(filePath: string, timestamp: string, beforeHash: string): string {
  const input = `${filePath}|${timestamp}|${beforeHash}`;
  return crypto.createHash("sha256").update(input).digest("hex").substring(0, 8);
}

function fileHash(absPath: string): string {
  try {
    const content = fs.readFileSync(absPath);
    return crypto.createHash("sha256").update(content).digest("hex");
  } catch {
    return crypto.createHash("sha256").update("").digest("hex");
  }
}

// ─── Timestamp (ms precision for multi-agent) ───────────────────

/**
 * Returns a compact ms-precision timestamp: YYYYMMDDHHmmssSSS±HHMM
 * Example: 20260329163012123+0800
 * Ms precision prevents hash8 collisions in multi-agent coworking.
 */
function getTimestamp(): string {
  const now = new Date();
  const p = (n: number, w: number) => String(n).padStart(w, "0");
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absOff = Math.abs(offset);
  return (
    `${now.getFullYear()}${p(now.getMonth() + 1, 2)}${p(now.getDate(), 2)}` +
    `${p(now.getHours(), 2)}${p(now.getMinutes(), 2)}${p(now.getSeconds(), 2)}` +
    `${p(now.getMilliseconds(), 3)}${sign}${p(Math.floor(absOff / 60), 2)}${p(absOff % 60, 2)}`
  );
}

// ─── Cell escaping ──────────────────────────────────────────────

/** Escapes pipe and newline chars so they don't break table parsing. */
function escapeCell(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

/** Reverses escapeCell. */
function unescapeCell(s: string): string {
  return s.replace(/\\\|/g, "|").replace(/\\\\/g, "\\");
}

/**
 * Splits a markdown table row into cells, respecting \| escapes.
 * Strips leading/trailing pipes.
 */
function parseTableRow(row: string): string[] {
  const trimmed = row.trim();
  const cells: string[] = [];
  let current = "";
  let i = trimmed.startsWith("|") ? 1 : 0;
  while (i < trimmed.length) {
    if (trimmed[i] === "\\" && i + 1 < trimmed.length) {
      current += trimmed[i] + trimmed[i + 1];
      i += 2;
    } else if (trimmed[i] === "|") {
      const cell = current.trim();
      if (cell) cells.push(cell);
      current = "";
      i++;
    } else {
      current += trimmed[i];
      i++;
    }
  }
  const last = current.trim();
  if (last) cells.push(last);
  return cells;
}

// ─── Arg parsing helper ─────────────────────────────────────────

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
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

function parseDna(dnaFilePath: string): { frontmatter: Frontmatter; entries: DnaEntry[] } {
  const content = fs.readFileSync(dnaFilePath, "utf-8");
  const fm: Frontmatter = {};
  const entries: DnaEntry[] = [];

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split("\n")) {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) fm[key.trim()] = rest.join(":").trim();
    }
  }

  const lines = content.split("\n");
  let inTable = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("| ID")) { inTable = true; continue; }
    if (trimmed.startsWith("|----") || trimmed.startsWith("|-")) { continue; }
    if (inTable && trimmed.startsWith("|")) {
      const cells = parseTableRow(trimmed);
      if (cells.length >= 5) {
        entries.push({
          id: unescapeCell(cells[0]),
          time: unescapeCell(cells[1]),
          agent: unescapeCell(cells[2]),
          act: unescapeCell(cells[3]),
          rationale: unescapeCell(cells[4]),
        });
      }
    }
  }

  return { frontmatter: fm, entries };
}

// ─── Core: insert DNA entry ─────────────────────────────────────

/**
 * Inserts a DNA entry into a file's .dna.md sidecar.
 * Creates the sidecar if it doesn't exist.
 * Returns the generated hash8 ID.
 */
function insertDnaEntry(
  file: string, act: string, rationale: string,
  agent: string, purpose?: string,
): string {
  const { absFile, relFile, root } = safePath(file);

  if (!needsDna(relFile)) {
    console.log(`  ${relFile} is exempt (.sifuignore) — skip`);
    return "";
  }

  const ts = getTimestamp();
  const bHash = fileHash(absFile);
  const id = generateHash8(relFile, ts, bHash);
  const dna = dnaPath(absFile);
  const relDna = path.relative(root, dna);

  const escapedAct = escapeCell(act);
  const escapedRationale = escapeCell(rationale);
  const newRow = `| ${id} | ${ts} | ${agent} | ${escapedAct} | ${escapedRationale} |`;

  if (fs.existsSync(dna)) {
    let content = fs.readFileSync(dna, "utf-8");
    // Insert new row after separator line
    content = content.replace(/^(\|-[-|\s]*\|)$/m, `$1\n${newRow}`);
    // Update frontmatter last
    if (content.includes("last:")) {
      content = content.replace(/^last:.*$/m, `last: ${id} @ ${ts}`);
    }
    fs.writeFileSync(dna, content);
    console.log(`  \x1b[32m+\x1b[0m ${relDna} — ${id}`);
  } else {
    const effectivePurpose = (purpose || rationale).replace(/\n/g, " ").trim();
    const content = [
      "---",
      `file: ${relFile}`,
      `purpose: ${effectivePurpose}`,
      `last: ${id} @ ${ts}`,
      "---",
      "",
      "| ID | Time | Agent | Act | Rationale |",
      "|----|------|-------|-----|-----------|",
      newRow,
      "",
    ].join("\n");
    fs.mkdirSync(path.dirname(dna), { recursive: true });
    fs.writeFileSync(dna, content);
    console.log(`  \x1b[32m+\x1b[0m ${relDna} — ${id} (created)`);
  }

  return id;
}

// ─── Commands ───────────────────────────────────────────────────

function cmdLog(args: string[]): void {
  const file = args[0];
  if (!file) {
    console.log('Usage: sifu log <file> --act "..." --rationale "..." [--agent name] [--purpose "..."]');
    process.exit(1);
  }
  const act = getArg(args, "--act");
  const rationale = getArg(args, "--rationale");
  const agent = getArg(args, "--agent") || "agent";
  const purpose = getArg(args, "--purpose");

  if (!act) { console.error("Error: --act is required"); process.exit(1); }
  if (!rationale) { console.error("Error: --rationale is required"); process.exit(1); }

  insertDnaEntry(file, act, rationale, agent, purpose);
}

function cmdDeprecate(args: string[]): void {
  const file = args[0];
  const oldId = args[1];
  if (!file || !oldId) {
    console.log('Usage: sifu deprecate <file> <old_id> --rationale "..." [--agent name]');
    process.exit(1);
  }
  const rationale = getArg(args, "--rationale");
  const agent = getArg(args, "--agent") || "agent";

  if (!rationale) { console.error("Error: --rationale is required"); process.exit(1); }
  if (!/^[0-9a-f]{8}$/.test(oldId)) {
    console.error(`Error: invalid ID format (expected 8 hex chars): ${oldId}`);
    process.exit(1);
  }

  const { absFile } = safePath(file);
  const dna = dnaPath(absFile);

  if (!fs.existsSync(dna)) {
    console.error(`Error: no .dna.md for ${file}`);
    process.exit(1);
  }

  const { entries } = parseDna(dna);
  if (!entries.find((e) => e.id === oldId)) {
    console.error(`Error: ID ${oldId} not found in ${path.basename(dna)}`);
    process.exit(1);
  }

  insertDnaEntry(file, `deprecated ${oldId}`, rationale, agent);
}

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

  const ts = getTimestamp();
  const bHash = fileHash(absFile);
  const id = generateHash8(relFile, ts, bHash);

  const content = [
    "---",
    `file: ${relFile}`,
    "purpose:",
    `last: ${id} @ ${ts}`,
    "---",
    "",
    "| ID | Time | Agent | Act | Rationale |",
    "|----|------|-------|-----|-----------|",
    `| ${id} | ${ts} | cli | initial creation | created by sifu new |`,
    "",
  ].join("\n");

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
    console.log(`| ${e.id} | ${e.time} | ${e.agent} | ${escapeCell(e.act)} | ${escapeCell(e.rationale)} |`);
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

    const hasLegacyEntries = /^entries:.*$/m.test(content);
    if (frontmatter.last === expectedLast && !hasLegacyEntries) continue;

    let newContent = content;
    if (frontmatter.last !== expectedLast) {
      if (frontmatter.last !== undefined) {
        newContent = newContent.replace(/^last:.*$/m, `last: ${expectedLast}`);
      } else {
        newContent = newContent.replace(/^(purpose:.*)$/m, `$1\nlast: ${expectedLast}`);
      }
    }
    // Remove legacy entries field if present
    newContent = newContent.replace(/^entries:.*\n/m, "");

    if (newContent !== content) {
      fs.writeFileSync(f.dnaFull, newContent);
      updated++;
    }
  }

  console.log(`Synced frontmatter for ${updated} .dna.md files.`);
}

function cmdHash(file: string | undefined): void {
  if (!file) { console.log("Usage: sifu hash <file>"); process.exit(1); }
  const { absFile, relFile } = safePath(file);
  const ts = getTimestamp();
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
  case "log":       cmdLog(args.slice(1)); break;
  case "deprecate": cmdDeprecate(args.slice(1)); break;
  case "check":     cmdCheck(args.includes("--strict")); break;
  case "status":    cmdStatus(); break;
  case "new":       cmdNew(args[1]); break;
  case "read": {
    const file = args[1];
    const allFlag = args.includes("--all");
    const nIdx = args.indexOf("-n");
    const n = allFlag ? Infinity : (nIdx >= 0 ? parseInt(args[nIdx + 1], 10) : 10);
    cmdRead(file, n);
    break;
  }
  case "sync":      cmdSync(); break;
  case "hash":      cmdHash(args[1]); break;
  default:
    console.log("SIFU CLI (0.3.0)\n");
    console.log("  sifu log <file> --act \"...\" --rationale \"...\"");
    console.log("                            Insert DNA entry (primary workflow)");
    console.log("  sifu deprecate <file> <id> --rationale \"...\"");
    console.log("                            Mark an entry as deprecated");
    console.log("  sifu check                List files missing .dna.md");
    console.log("  sifu status               Show DNA coverage stats");
    console.log("  sifu new <file>           Create .dna.md template");
    console.log("  sifu read <file>          Show top 10 DNA entries (newest first)");
    console.log("  sifu read <f> --all       Show all entries");
    console.log("  sifu sync                 Update frontmatter caches");
    console.log("  sifu hash <file>          Generate a DNA hash8 ID");
    console.log("  sifu init                 Install SIFU in current project\n");
    console.log("Options:");
    console.log("  --agent <name>            Agent identity (default: agent)");
    console.log("  --purpose <text>          File purpose (for new sidecars)");
    console.log("  --strict                  Exit 1 if files missing DNA (CI)");
}
