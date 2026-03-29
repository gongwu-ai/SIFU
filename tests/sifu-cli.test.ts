import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";

const CLI = path.resolve("dist/sifu-cli.js");
const run = (args: string, cwd: string): string =>
  execSync(`node ${CLI} ${args}`, { cwd, encoding: "utf-8", timeout: 5000 });

// ─── Unit: hash8 generation ────────────────────────────────────

describe("hash8 ID generation", () => {
  it("produces 8 hex chars", () => {
    const input = "src/foo.js|202603291402+0800|e3b0c44298fc1c14";
    const hash = crypto.createHash("sha256").update(input).digest("hex").substring(0, 8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic — same inputs produce same output", () => {
    const input = "src/foo.js|202603291402+0800|abc123";
    const h1 = crypto.createHash("sha256").update(input).digest("hex").substring(0, 8);
    const h2 = crypto.createHash("sha256").update(input).digest("hex").substring(0, 8);
    expect(h1).toBe(h2);
  });

  it("different inputs produce different IDs", () => {
    const i1 = "src/foo.js|202603291402+0800|abc";
    const i2 = "src/bar.js|202603291402+0800|abc";
    const h1 = crypto.createHash("sha256").update(i1).digest("hex").substring(0, 8);
    const h2 = crypto.createHash("sha256").update(i2).digest("hex").substring(0, 8);
    expect(h1).not.toBe(h2);
  });
});

// ─── Integration: CLI commands ──────────────────────────────────

describe("CLI commands", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sifu-test-"));
    fs.writeFileSync(path.join(tmpDir, "app.js"), "console.log('hi');\n");
    fs.writeFileSync(path.join(tmpDir, "README.md"), "# Test\n");
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules\n");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("help prints usage", () => {
    const out = run("", tmpDir);
    expect(out).toContain("SIFU CLI");
    expect(out).toContain("sifu check");
    expect(out).toContain("sifu log");
  });

  it("check lists files missing .dna.md", () => {
    const out = run("check", tmpDir);
    expect(out).toContain("Missing .dna.md");
    expect(out).toContain("app.js");
    expect(out).toContain("README.md");
    expect(out).not.toContain(".gitignore");
  });

  it("status shows 0% when no DNA", () => {
    const out = run("status", tmpDir);
    expect(out).toContain("0/2");
    expect(out).toContain("0%");
  });

  it("new creates hidden sidecar with correct format", () => {
    const out = run("new app.js", tmpDir);
    expect(out).toContain("Created");

    const dnaFile = path.join(tmpDir, ".app.js.dna.md");
    expect(fs.existsSync(dnaFile)).toBe(true);

    const content = fs.readFileSync(dnaFile, "utf-8");
    expect(content).toContain("file: app.js");
    expect(content).toContain("purpose:");
    expect(content).toContain("last:");
    // entries field dropped in 0.3.0
    expect(content).not.toContain("entries:");
    expect(content).toContain("| ID | Time | Agent | Act | Rationale |");
    expect(content).toMatch(/\| [0-9a-f]{8} \|/);
  });

  it("new does not overwrite existing sidecar", () => {
    run("new app.js", tmpDir);
    const out = run("new app.js", tmpDir);
    expect(out).toContain("already exists");
  });

  it("check shows 100% after creating all sidecars", () => {
    run("new app.js", tmpDir);
    run("new README.md", tmpDir);
    const out = run("status", tmpDir);
    expect(out).toContain("2/2");
    expect(out).toContain("100%");
  });

  it("hash prints deterministic ID for a file", () => {
    const out = run("hash app.js", tmpDir);
    expect(out).toContain("DNA ID:");
    expect(out).toMatch(/DNA ID:\s+[0-9a-f]{8}/);
  });

  it("read shows entries from .dna.md", () => {
    run("new app.js", tmpDir);
    const out = run("read app.js", tmpDir);
    expect(out).toContain("app.js");
    expect(out).toContain("initial creation");
  });

  it("exempts directories correctly", () => {
    const nmDir = path.join(tmpDir, "node_modules", "foo");
    fs.mkdirSync(nmDir, { recursive: true });
    fs.writeFileSync(path.join(nmDir, "bar.js"), "x");
    const out = run("check", tmpDir);
    expect(out).not.toContain("node_modules");
  });

  it("exempts binary extensions", () => {
    fs.writeFileSync(path.join(tmpDir, "logo.png"), "fake png");
    const out = run("check", tmpDir);
    expect(out).not.toContain("logo.png");
  });

  it("exempts .sifuignore itself", () => {
    fs.writeFileSync(path.join(tmpDir, ".sifuignore"), "# test\n");
    const out = run("check", tmpDir);
    expect(out).not.toContain(".sifuignore");
  });
});

// ─── sifu log ───────────────────────────────────────────────────

describe("sifu log", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sifu-log-"));
    fs.writeFileSync(path.join(tmpDir, "app.js"), "console.log('hi');\n");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates new .dna.md when none exists", () => {
    const out = run('log app.js --act "initial creation" --rationale "need entry point" --agent opus', tmpDir);
    expect(out).toContain("created");

    const dna = path.join(tmpDir, ".app.js.dna.md");
    expect(fs.existsSync(dna)).toBe(true);

    const content = fs.readFileSync(dna, "utf-8");
    expect(content).toContain("file: app.js");
    expect(content).toContain("purpose: need entry point");
    expect(content).toContain("last:");
    expect(content).toContain("opus");
    expect(content).toContain("initial creation");
    expect(content).toContain("need entry point");
    expect(content).toMatch(/\| [0-9a-f]{8} \|/);
  });

  it("inserts entry at top of existing .dna.md", () => {
    run('log app.js --act "initial" --rationale "first" --agent opus', tmpDir);
    run('log app.js --act "add feature" --rationale "second reason" --agent sonnet', tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    const lines = content.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| ID"));
    // Newest entry should be first
    expect(lines[0]).toContain("add feature");
    expect(lines[0]).toContain("sonnet");
    expect(lines[1]).toContain("initial");
    expect(lines[1]).toContain("opus");
  });

  it("uses ms-precision timestamp", () => {
    run('log app.js --act "test" --rationale "ts check" --agent opus', tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    // Ms timestamp: YYYYMMDDHHmmssSSS±HHMM (22 chars)
    expect(content).toMatch(/\| \d{17}[+-]\d{4} \|/);
  });

  it("uses --purpose for new sidecar when provided", () => {
    run('log app.js --act "initial" --rationale "reason" --agent opus --purpose "entry point"', tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    expect(content).toContain("purpose: entry point");
  });

  it("falls back to rationale for purpose when --purpose omitted", () => {
    run('log app.js --act "initial" --rationale "the app entry point" --agent opus', tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    expect(content).toContain("purpose: the app entry point");
  });

  it("updates frontmatter last on subsequent entries", () => {
    run('log app.js --act "first" --rationale "r1" --agent opus', tmpDir);
    const before = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    const lastBefore = before.match(/^last: (.*)$/m)![1];

    // Small delay to ensure different timestamp
    execSync("sleep 0.01");

    run('log app.js --act "second" --rationale "r2" --agent opus', tmpDir);
    const after = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    const lastAfter = after.match(/^last: (.*)$/m)![1];

    expect(lastAfter).not.toBe(lastBefore);
  });

  it("skips exempt files", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "x");
    const out = run('log .gitignore --act "test" --rationale "test" --agent opus', tmpDir);
    expect(out).toContain("exempt");
    expect(fs.existsSync(path.join(tmpDir, "..gitignore.dna.md"))).toBe(false);
  });

  it("escapes pipes in act and rationale", () => {
    run('log app.js --act "a | b" --rationale "x | y" --agent opus', tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    // Escaped pipes should not break table structure
    const lines = content.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| ID"));
    expect(lines.length).toBe(1);
    // read re-escapes for table display, purpose in frontmatter is unescaped
    const readOut = run("read app.js", tmpDir);
    expect(readOut).toContain("a \\| b");
    expect(readOut).toContain("x \\| y");
    // Purpose in frontmatter is NOT escaped (YAML, not table)
    expect(readOut).toContain("Purpose: x | y");
  });

  it("works for files that don't exist yet", () => {
    const out = run('log newfile.js --act "initial creation" --rationale "new module" --agent opus', tmpDir);
    expect(out).toContain("created");
    expect(fs.existsSync(path.join(tmpDir, ".newfile.js.dna.md"))).toBe(true);
  });

  it("requires --act and --rationale", () => {
    expect(() => run("log app.js", tmpDir)).toThrow();
    expect(() => run('log app.js --act "test"', tmpDir)).toThrow();
  });

  it("defaults agent to 'agent' when --agent omitted", () => {
    run('log app.js --act "test" --rationale "reason"', tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    expect(content).toContain("| agent |");
  });
});

// ─── sifu deprecate ─────────────────────────────────────────────

describe("sifu deprecate", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sifu-dep-"));
    fs.writeFileSync(path.join(tmpDir, "app.js"), "code");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("inserts deprecated entry for valid old ID", () => {
    run('log app.js --act "add feature" --rationale "need it" --agent opus', tmpDir);
    // Extract the ID from the DNA
    const dna = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    const idMatch = dna.match(/\| ([0-9a-f]{8}) \|/);
    expect(idMatch).not.toBeNull();
    const oldId = idMatch![1];

    run(`deprecate app.js ${oldId} --rationale "wrong approach" --agent sonnet`, tmpDir);

    const updated = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    expect(updated).toContain(`deprecated ${oldId}`);
    expect(updated).toContain("wrong approach");
    // Should now have 2 entries
    const rows = updated.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| ID"));
    expect(rows.length).toBe(2);
    // Newest (deprecated) entry is first
    expect(rows[0]).toContain("deprecated");
  });

  it("rejects invalid old ID", () => {
    run('log app.js --act "add" --rationale "reason" --agent opus', tmpDir);
    expect(() => run('deprecate app.js deadbeef --rationale "nope" --agent opus', tmpDir)).toThrow();
  });

  it("rejects when no .dna.md exists", () => {
    expect(() => run('deprecate app.js a1b2c3d4 --rationale "nope" --agent opus', tmpDir)).toThrow();
  });
});

// ─── safePath hardening ─────────────────────────────────────────

describe("safePath hardening", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sifu-safe-"));
    fs.writeFileSync(path.join(tmpDir, "app.js"), "code");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects path escape with ../", () => {
    expect(() => run("new ../escape.js", tmpDir)).toThrow();
  });

  it("rejects .dna.md as direct target", () => {
    expect(() => run("new .app.js.dna.md", tmpDir)).toThrow();
  });

  it("rejects directory as target", () => {
    fs.mkdirSync(path.join(tmpDir, "subdir"));
    expect(() => run("new subdir", tmpDir)).toThrow();
  });
});

// ─── .sifuignore custom patterns ────────────────────────────────

describe(".sifuignore", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sifu-ignore-"));
    fs.writeFileSync(path.join(tmpDir, "app.js"), "code");
    fs.writeFileSync(path.join(tmpDir, "data.csv"), "a,b,c");
    fs.writeFileSync(path.join(tmpDir, "config.toml"), "[x]");
    fs.mkdirSync(path.join(tmpDir, "vendor"));
    fs.writeFileSync(path.join(tmpDir, "vendor", "lib.js"), "x");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("uses hardcoded defaults when .sifuignore is absent", () => {
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "x");
    const out = run("check", tmpDir);
    expect(out).not.toContain(".gitignore");
    expect(out).toContain("app.js");
  });

  it("respects custom directory exemptions", () => {
    fs.writeFileSync(path.join(tmpDir, ".sifuignore"), "vendor/\n");
    const out = run("check", tmpDir);
    expect(out).not.toContain("vendor");
    expect(out).toContain("app.js");
  });

  it("respects custom extension exemptions", () => {
    fs.writeFileSync(path.join(tmpDir, ".sifuignore"), "*.csv\n");
    const out = run("check", tmpDir);
    expect(out).not.toContain("data.csv");
    expect(out).toContain("app.js");
  });

  it("respects custom filename exemptions", () => {
    fs.writeFileSync(path.join(tmpDir, ".sifuignore"), "config.toml\n");
    const out = run("check", tmpDir);
    expect(out).not.toContain("config.toml");
    expect(out).toContain("app.js");
  });

  it("ignores comments and blank lines", () => {
    fs.writeFileSync(path.join(tmpDir, ".sifuignore"), "# comment\n\n*.csv\n");
    const out = run("check", tmpDir);
    expect(out).not.toContain("data.csv");
    expect(out).toContain("app.js");
  });

  it("supports prefix globs like .env.*", () => {
    fs.writeFileSync(path.join(tmpDir, ".env.prod"), "SECRET=x");
    fs.writeFileSync(path.join(tmpDir, ".env.local"), "SECRET=y");
    fs.writeFileSync(path.join(tmpDir, ".sifuignore"), ".env.*\n");
    const out = run("check", tmpDir);
    expect(out).not.toContain(".env.prod");
    expect(out).not.toContain(".env.local");
    expect(out).toContain("app.js");
  });
});

// ─── sync removes legacy entries field ──────────────────────────

describe("sync", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sifu-sync-"));
    fs.writeFileSync(path.join(tmpDir, "app.js"), "code");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes legacy entries field from frontmatter", () => {
    fs.writeFileSync(path.join(tmpDir, ".app.js.dna.md"), [
      "---",
      "file: app.js",
      "purpose: test",
      "last: old @ old",
      "entries: 1",
      "---",
      "",
      "| ID | Time | Agent | Act | Rationale |",
      "|----|------|-------|-----|-----------|",
      "| a1b2c3d4 | 20260329 | opus | test | reason |",
      "",
    ].join("\n"));

    run("sync", tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    expect(content).not.toContain("entries:");
    expect(content).toContain("last: a1b2c3d4 @ 20260329");
  });

  it("removes legacy entries even when last is already correct", () => {
    fs.writeFileSync(path.join(tmpDir, ".app.js.dna.md"), [
      "---",
      "file: app.js",
      "purpose: test",
      "last: a1b2c3d4 @ 20260329",
      "entries: 1",
      "---",
      "",
      "| ID | Time | Agent | Act | Rationale |",
      "|----|------|-------|-----|-----------|",
      "| a1b2c3d4 | 20260329 | opus | test | reason |",
      "",
    ].join("\n"));

    run("sync", tmpDir);

    const content = fs.readFileSync(path.join(tmpDir, ".app.js.dna.md"), "utf-8");
    expect(content).not.toContain("entries:");
    expect(content).toContain("last: a1b2c3d4 @ 20260329");
  });
});
