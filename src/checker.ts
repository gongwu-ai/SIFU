/**
 * SIFU v1 DNA Checker
 *
 * Core logic for DNA-first enforcement at write time.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { needsDna } from "./patterns.js";
import type { CheckResult, HookInput, DnaStructure, DnaValidation } from "./types.js";

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

/**
 * Parse and validate .dna file structure.
 * v1.2 Smart Rationale Reading - validates structure and extracts sections.
 *
 * Required sections:
 * - ## Decision Rationale (must have at least one [DNA-###])
 * - ## Implementation History (can be empty)
 *
 * @param content - Raw content of .dna file
 * @returns DnaValidation with parsed structure or error
 */
export function parseDna(content: string): DnaValidation {
  const hasRationale = /^## Decision Rationale/m.test(content);
  const hasHistory = /^## Implementation History/m.test(content);

  if (!hasRationale) {
    return { valid: false, error: "Missing '## Decision Rationale' section" };
  }
  if (!hasHistory) {
    return { valid: false, error: "Missing '## Implementation History' section" };
  }

  // Extract sections
  const rationaleMatch = content.match(
    /## Decision Rationale\s*([\s\S]*?)(?=\n## |$)/
  );
  const historyMatch = content.match(
    /## Implementation History\s*([\s\S]*?)(?=\n## |$)/
  );
  const miscMatch = content.match(/## Misc\s*([\s\S]*?)(?=\n## |$)/);

  const rationale = rationaleMatch?.[1]?.trim() || "";
  const history = historyMatch?.[1]?.trim() || "";
  const misc = miscMatch?.[1]?.trim();

  // Validate rationale has at least one DNA ID
  if (!/\[DNA-\d+\]/.test(rationale)) {
    return {
      valid: false,
      error: "Decision Rationale must have at least one [DNA-###]",
    };
  }

  return {
    valid: true,
    structure: { rationale, history, misc },
  };
}

/**
 * Extract only the Decision Rationale section from a .dna file.
 * v1.2 Smart Rationale Reading - avoids context explosion.
 *
 * Use this instead of reading the entire .dna file when you only
 * need to check existing decisions.
 *
 * @param dnaPath - Path to .dna file
 * @returns Rationale content or error message
 */
export function extractRationale(dnaPath: string): string {
  try {
    const content = readFileSync(dnaPath, "utf-8");
    const validation = parseDna(content);

    if (!validation.valid) {
      return `[ERROR: ${validation.error}]`;
    }

    return validation.structure!.rationale;
  } catch (error) {
    return `[ERROR: Cannot read ${dnaPath}: ${error}]`;
  }
}

/**
 * Validate .dna file structure from path.
 *
 * @param dnaPath - Path to .dna file
 * @returns DnaValidation
 */
export function validateDnaFile(dnaPath: string): DnaValidation {
  try {
    const content = readFileSync(dnaPath, "utf-8");
    return parseDna(content);
  } catch (error) {
    return { valid: false, error: `Cannot read file: ${error}` };
  }
}
