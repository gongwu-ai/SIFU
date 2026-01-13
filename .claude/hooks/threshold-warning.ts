#!/usr/bin/env npx tsx
/**
 * SIFU Threshold Warning Hook (v1.1)
 *
 * Claude Code PostToolUse hook that warns when uncommitted changes exceed threshold.
 *
 * Exit codes:
 * - 0: Always (warning only, never blocks)
 */

import { createInterface } from "node:readline";
import { execSync } from "node:child_process";

const DEFAULT_THRESHOLD = 1000;

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

function getUncommittedLineCount(): number {
  try {
    // Get diff stat for both staged and unstaged changes
    const output = execSync("git diff --stat HEAD 2>/dev/null || git diff --stat", {
      encoding: "utf-8",
      timeout: 5000,
    });

    // Parse the summary line: "X files changed, Y insertions(+), Z deletions(-)"
    const summaryMatch = output.match(
      /(\d+)\s+insertions?\(\+\).*?(\d+)\s+deletions?\(-\)/
    );
    if (summaryMatch) {
      const insertions = parseInt(summaryMatch[1], 10);
      const deletions = parseInt(summaryMatch[2], 10);
      return insertions + deletions;
    }

    // Try just insertions
    const insertOnly = output.match(/(\d+)\s+insertions?\(\+\)/);
    if (insertOnly) {
      return parseInt(insertOnly[1], 10);
    }

    // Try just deletions
    const deleteOnly = output.match(/(\d+)\s+deletions?\(-\)/);
    if (deleteOnly) {
      return parseInt(deleteOnly[1], 10);
    }

    return 0;
  } catch {
    return 0;
  }
}

async function main(): Promise<void> {
  try {
    const input = await readStdin();
    const data: HookInput = JSON.parse(input);

    const { tool_name } = data;

    // Only check after Write and Edit tools
    if (tool_name !== "Write" && tool_name !== "Edit") {
      process.exit(0);
    }

    const lineCount = getUncommittedLineCount();
    const threshold = DEFAULT_THRESHOLD;

    if (lineCount > threshold) {
      console.error(`\n⚠️  SIFU THRESHOLD WARNING ⚠️`);
      console.error(`Uncommitted changes: ${lineCount} lines (threshold: ${threshold})`);
      console.error(`Consider committing your changes to avoid losing work.`);
      console.error(`Run: git add -A && git commit -m "checkpoint"\n`);
    }

    process.exit(0);
  } catch (error) {
    // On error, silently continue
    process.exit(0);
  }
}

main();
