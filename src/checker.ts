/**
 * SIFU v1 DNA Checker
 *
 * Core logic for DNA-first enforcement at write time.
 */

import { existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { needsDna } from "./patterns.js";
import type { CheckResult, HookInput } from "./types.js";

/**
 * Get the project root directory.
 * Walks up from cwd looking for SIFU.dna or .git.
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = startDir;
  while (dir !== "/") {
    if (existsSync(resolve(dir, "SIFU.dna")) || existsSync(resolve(dir, ".git"))) {
      return dir;
    }
    dir = resolve(dir, "..");
  }
  return startDir;
}

/**
 * Check if a file write should be allowed.
 *
 * @param filePath - Absolute path to the file being written
 * @param projectRoot - Project root directory
 * @returns CheckResult with allowed status and reason
 */
export function checkDnaExists(filePath: string, projectRoot: string): CheckResult {
  // Convert to relative path for pattern matching
  const relativePath = relative(projectRoot, filePath);

  // Check if file is exempt from DNA requirement
  if (!needsDna(relativePath)) {
    return { allowed: true, reason: "File exempt from DNA requirement" };
  }

  // Check if DNA sidecar exists
  const dnaPath = `${filePath}.dna`;
  if (existsSync(dnaPath)) {
    return { allowed: true, dnaPath };
  }

  // DNA required but missing - block
  return {
    allowed: false,
    reason: `DNA-first violation: ${dnaPath} does not exist`,
    dnaPath,
  };
}

/**
 * Process hook input and determine if tool should be allowed.
 *
 * @param input - HookInput from Claude Code
 * @returns CheckResult
 */
export function processHookInput(input: HookInput): CheckResult {
  const { tool_name, tool_input } = input;

  // Only check Write and Edit tools
  if (tool_name !== "Write" && tool_name !== "Edit") {
    return { allowed: true, reason: "Tool not subject to DNA check" };
  }

  // Must have file_path
  const filePath = tool_input?.file_path;
  if (!filePath) {
    return { allowed: true, reason: "No file path in tool input" };
  }

  const projectRoot = findProjectRoot();
  return checkDnaExists(filePath, projectRoot);
}
