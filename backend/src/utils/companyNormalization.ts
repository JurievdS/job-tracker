/**
 * Company Name Normalization Utility
 *
 * Normalizes company names for duplicate detection:
 * 1. Converts to lowercase
 * 2. Removes common suffixes (LLC, Inc, Corp, Ltd, etc.)
 * 3. Removes punctuation
 * 4. Trims and collapses whitespace
 */

// Common company suffixes to remove (case-insensitive)
const COMPANY_SUFFIXES = [
  // US
  'llc',
  'l\\.l\\.c\\.',
  'l\\.l\\.c',
  'inc',
  'inc\\.',
  'incorporated',
  'corp',
  'corp\\.',
  'corporation',
  'co',
  'co\\.',
  'company',
  'ltd',
  'ltd\\.',
  'limited',
  'lp',
  'l\\.p\\.',
  'lp\\.',
  'llp',
  'l\\.l\\.p\\.',
  'llp\\.',
  'pllc',
  'p\\.l\\.l\\.c\\.',
  // UK
  'plc',
  'p\\.l\\.c\\.',
  // German
  'gmbh',
  'g\\.m\\.b\\.h\\.',
  'ag',
  'a\\.g\\.',
  // French/Spanish
  'sa',
  's\\.a\\.',
  'sarl',
  's\\.a\\.r\\.l\\.',
  // Other
  'bv',
  'b\\.v\\.',
  'nv',
  'n\\.v\\.',
  'pty',
  'pty\\.',
  'holdings',
  'group',
  'international',
  'intl',
  'intl\\.',
];

// Build regex pattern for suffix removal
const SUFFIX_PATTERN = new RegExp(
  `\\b(${COMPANY_SUFFIXES.join('|')})\\s*$`,
  'gi'
);

/**
 * Normalize a company name for duplicate detection
 * @param name Original company name
 * @returns Normalized name for comparison
 */
export function normalizeCompanyName(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Remove trailing punctuation first (commas, periods)
  normalized = normalized.replace(/[.,]+\s*$/, '').trim();

  // Remove common suffixes (may need multiple passes for cases like "Corp. Ltd.")
  let previousLength = 0;
  while (normalized.length !== previousLength) {
    previousLength = normalized.length;
    normalized = normalized.replace(SUFFIX_PATTERN, '').trim();
    // Remove any trailing punctuation that was before the suffix
    normalized = normalized.replace(/[.,]+\s*$/, '').trim();
  }

  // Remove remaining punctuation except spaces and alphanumeric
  normalized = normalized.replace(/[^\w\s]/g, '');

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Calculate similarity score between two company names
 * Uses Levenshtein distance normalized to 0-1 scale
 * @returns Score from 0 (completely different) to 1 (identical)
 */
export function calculateSimilarity(name1: string, name2: string): number {
  const s1 = normalizeCompanyName(name1);
  const s2 = normalizeCompanyName(name2);

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const distance = levenshteinDistance(s1, s2);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance implementation
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
