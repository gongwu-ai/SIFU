/**
 * SIFU v1 Type Definitions
 *
 * Types for Claude Code hook integration and DNA enforcement.
 */

/**
 * Input structure from Claude Code PreToolUse hook.
 * Received via stdin as JSON.
 */
export interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
    old_string?: string;
    new_string?: string;
  };
}

/**
 * Result of DNA check operation.
 */
export interface CheckResult {
  allowed: boolean;
  reason?: string;
  dnaPath?: string;
}

/**
 * Exit codes for Claude Code hooks.
 * - 0: Allow tool execution
 * - 2: Block tool execution (error shown to agent)
 */
export const EXIT_CODES = {
  ALLOW: 0,
  BLOCK: 2,
} as const;
