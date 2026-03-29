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
    // Exempt file — should not need DNA
    fs.writeFileSync(path.join(tmpDir, ".gitignore"), "node_modules\n");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("help prints usage", () => {
    const out = run("", tmpDir);
    expect(out).toContain("SIFU CLI");
    expect(out).toContain("sifu check");
  });

  it("check lists files missing .dna.md", () => {
    const out = run("check", tmpDir);
    expect(out).toContain("Missing .dna.md");
    expect(out).toContain("app.js");
    expect(out).toContain("README.md");
    // .gitignore should NOT appear (exempt)
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
    // Frontmatter
    expect(content).toContain("file: app.js");
    expect(content).toContain("purpose:");
    expect(content).toContain("last:");
    expect(content).toContain("entries: 1");
    // Table header
    expect(content).toContain("| ID | Time | Agent | Act | Rationale |");
    // Has a hash8 ID
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
    // .gitignore should be exempt by default
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

  it("rejects path escape with ../", () => {
    expect(() => run("new ../escape.js", tmpDir)).toThrow();
  });
});
