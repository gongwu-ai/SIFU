/**
 * SIFU v1 Exempt Patterns
 *
 * Files matching these patterns do NOT require DNA sidecars.
 * Ported from v0 Python: scripts/sifu_check.py
 */

/**
 * Patterns for files that don't need .dna sidecars.
 * Order doesn't matter - any match exempts the file.
 */
export const EXEMPT_PATTERNS: RegExp[] = [
  // DNA files themselves
  /\.dna$/,
  /^SIFU\.dna$/,

  // Project documentation
  /^CLAUDE\.md$/,
  /^AGENTS\.md$/,
  /^README\.md$/,

  // Directories (relative paths)
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

  // Config files by extension
  /\.gitignore$/,
  /\.json$/,
  /\.yaml$/,
  /\.yml$/,
  /\.toml$/,
  /\.md$/,
  /\.txt$/,
  /\.lock$/,
];

/**
 * Check if a file path needs a DNA sidecar.
 *
 * @param filepath - Relative file path from project root
 * @returns true if file needs DNA, false if exempt
 */
export function needsDna(filepath: string): boolean {
  for (const pattern of EXEMPT_PATTERNS) {
    if (pattern.test(filepath)) {
      return false;
    }
  }
  return true;
}
