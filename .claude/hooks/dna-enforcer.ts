#!/usr/bin/env npx tsx
/**
 * SIFU DNA Enforcer Hook
 *
 * Claude Code PreToolUse hook that blocks Write/Edit without .dna sidecar.
 *
 * Exit codes:
 * - 0: Allow tool execution
 * - 2: Block tool execution (error shown to agent)
 */

import { createInterface } from "node:readline";
import { existsSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";

// Inline patterns to avoid import complexity in hook context
const EXEMPT_PATTERNS: RegExp[] = [
  /\.dna$/,
  /^SIFU\.dna$/,
  /^CLAUDE\.md$/,
  /^AGENTS\.md$/,
  /^README\.md$/,
  /^\.git\//,
  /^\.venv\//,
  /^\.githooks\//,
  /^\.claude\//,
  /^archive\//,
  /^docs\//,
  /^tests\//,
  /^scripts\//,
  /^dist\//,
  /^node_modules\//,
  /\.gitignore$/,
  /\.json$/,
  /\.yaml$/,
  /\.yml$/,
  /\.toml$/,
  /\.md$/,
  /\.txt$/,
  /\.lock$/,
];

function needsDna(filepath: string): boolean {
  for (const pattern of EXEMPT_PATTERNS) {
    if (pattern.test(filepath)) {
      return false;
    }
  }
  return true;
}

interface DnaValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validates .dna file structure per CLAUDE.md spec:
 * - Must have "## Decision Rationale" section
 * - Must have "## Implementation History" section
 * - Decision Rationale must contain at least one [DNA-###]
 */
function validateDnaStructure(dnaPath: string): DnaValidation {
  try {
    const content = readFileSync(dnaPath, "utf-8");

    // Check required sections
    if (!/^## Decision Rationale/m.test(content)) {
      return { valid: false, error: "Missing '## Decision Rationale' section" };
    }
    if (!/^## Implementation History/m.test(content)) {
      return { valid: false, error: "Missing '## Implementation History' section" };
    }

    // Extract rationale section and check for at least one DNA ID
    const rationaleMatch = content.match(
      /## Decision Rationale\s*([\s\S]*?)(?=\n## |$)/
    );
    const rationaleSection = rationaleMatch?.[1]?.trim() || "";

    if (!/\[DNA-\d+\]/.test(rationaleSection)) {
      return {
        valid: false,
        error: "Decision Rationale must have at least one [DNA-###]",
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Cannot read .dna file: ${error}` };
  }
}

function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = startDir;
  while (dir !== "/") {
    if (existsSync(resolve(dir, "SIFU.dna")) || existsSync(resolve(dir, ".git"))) {
      return dir;
    }
    dir = resolve(dir, "..");
  }
  return startDir;
}

interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
  };
}

async function readStdin(): Promise<string> {
  const rl = createInterface({ input: process.stdin });
  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  try {
    const input = await readStdin();
    const data: HookInput = JSON.parse(input);

    const { tool_name, tool_input } = data;

    // Only check Write and Edit tools
    if (tool_name !== "Write" && tool_name !== "Edit") {
      process.exit(0);
    }

    const filePath = tool_input?.file_path;
    if (!filePath) {
      process.exit(0);
    }

    const projectRoot = findProjectRoot();
    const relativePath = relative(projectRoot, filePath);

    // Check if exempt
    if (!needsDna(relativePath)) {
      process.exit(0);
    }

    // Check if DNA exists and is valid
    const dnaPath = `${filePath}.dna`;
    if (!existsSync(dnaPath)) {
      console.error(`SIFU BLOCKED: ${relativePath}`);
      console.error(`DNA-first violation: ${relativePath}.dna does not exist`);
      console.error(`Create the .dna file first, then write the code.`);
      process.exit(2);
    }

    // Validate DNA structure (空 .dna 是漏洞)
    const validation = validateDnaStructure(dnaPath);
    if (!validation.valid) {
      console.error(`SIFU BLOCKED: ${relativePath}`);
      console.error(`Invalid .dna structure: ${validation.error}`);
      console.error(`Fix the .dna file before writing code.`);
      process.exit(2);
    }

    // DNA exists and is valid - allow
    process.exit(0);
  } catch (error) {
    // On error, allow the tool to proceed (fail open)
    console.error(`SIFU hook error: ${error}`);
    process.exit(0);
  }
}

main();
