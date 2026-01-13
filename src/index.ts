/**
 * SIFU v1 - DNA-first enforcement for agentic coding
 *
 * Entry point for the DNA enforcer library.
 */

export { needsDna, EXEMPT_PATTERNS } from "./patterns.js";
export {
  checkDnaExists,
  processHookInput,
  findProjectRoot,
  parseDna,
  extractRationale,
  validateDnaFile,
} from "./checker.js";
export { EXIT_CODES } from "./types.js";
export type { HookInput, CheckResult, DnaStructure, DnaValidation } from "./types.js";
