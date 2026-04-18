// ---------------------------------------------------------------------------
// Caseify – universal text‑case converter
// ---------------------------------------------------------------------------

export type CaseCategory = 'common' | 'programming';

export interface CaseDefinition {
  id: string;
  name: string;
  aliases?: string[];
  category: CaseCategory;
  convert: (tokens: string[]) => string;
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

const DELIMITER_RE = /[_\-./\\]|::/;
const WORD_RE = /[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\d|\b|$)|[A-Z]|\d+/g;
const STRIP_RE = /[^a-zA-Z0-9_\-./\\:\s]/g;

/**
 * Split any input string into normalised word tokens.
 *
 * Phase 1 – split on explicit delimiters (_, -, ., /, \, ::, whitespace).
 * Phase 2 – sub‑split each fragment on casing transitions, preserving acronyms.
 */
export function tokenize(input: string): string[] {
  // Replace special characters with spaces (so they act as word boundaries)
  const cleaned = input.replace(STRIP_RE, ' ').trim();
  if (!cleaned) return [];

  // Phase 1: split on delimiters and whitespace
  const fragments = cleaned.split(DELIMITER_RE).flatMap(f => f.split(/\s+/));

  // Phase 2: sub‑split on casing transitions
  const tokens: string[] = [];
  for (const fragment of fragments) {
    if (!fragment) continue;
    const matches = fragment.match(WORD_RE);
    if (matches) {
      tokens.push(...matches);
    } else {
      // Fallback – push as‑is (e.g. pure digits already matched above)
      tokens.push(fragment);
    }
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Multi‑line helper
// ---------------------------------------------------------------------------

/**
 * Apply a converter to the input.
 * Single‑line input → treat entire string as one unit.
 * Multi‑line input  → convert each line independently.
 */
export function convertText(
  input: string,
  convert: (tokens: string[]) => string
): string {
  const lines = input.split('\n');

  if (lines.length === 1) {
    const tokens = tokenize(input);
    return tokens.length > 0 ? convert(tokens) : '';
  }

  return lines
    .map(line => {
      const trimmed = line.trim();
      if (trimmed === '') return '';
      const tokens = tokenize(trimmed);
      return tokens.length > 0 ? convert(tokens) : '';
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const lower = (s: string) => s.toLowerCase();
const upper = (s: string) => s.toUpperCase();
const capitalize = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

// ---------------------------------------------------------------------------
// Case definitions
// ---------------------------------------------------------------------------

export const CASE_DEFINITIONS: readonly CaseDefinition[] = [
  // ── Common Text Cases ────────────────────────────────────────────────
  {
    id: 'lowercase',
    name: 'lowercase',
    category: 'common',
    convert: t => t.map(lower).join(' '),
  },
  {
    id: 'uppercase',
    name: 'UPPERCASE',
    category: 'common',
    convert: t => t.map(upper).join(' '),
  },
  {
    id: 'sentence-case',
    name: 'Sentence case',
    category: 'common',
    convert: t => [capitalize(t[0]), ...t.slice(1).map(lower)].join(' '),
  },
  {
    id: 'title-case',
    name: 'Title Case',
    category: 'common',
    convert: t => t.map(capitalize).join(' '),
  },
  {
    id: 'inverse-case',
    name: 'iNVERSE cASE',
    category: 'common',
    convert: t =>
      t
        .map(w =>
          w
            .split('')
            .map((c, i) => (i === 0 ? c.toLowerCase() : c.toUpperCase()))
            .join('')
        )
        .join(' '),
  },
  {
    id: 'alternating-case',
    name: 'aLtErNaTiNg cAsE',
    category: 'common',
    convert: t => {
      const joined = t.map(lower).join(' ');
      return joined
        .split('')
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join('');
    },
  },

  // ── Programming / Code Cases ─────────────────────────────────────────
  {
    id: 'camel-case',
    name: 'camelCase',
    category: 'programming',
    convert: t => [lower(t[0]), ...t.slice(1).map(capitalize)].join(''),
  },
  {
    id: 'pascal-case',
    name: 'PascalCase',
    category: 'programming',
    convert: t => t.map(capitalize).join(''),
  },
  {
    id: 'snake-case',
    name: 'snake_case',
    category: 'programming',
    convert: t => t.map(lower).join('_'),
  },
  {
    id: 'screaming-snake-case',
    name: 'SCREAMING_SNAKE_CASE',
    aliases: ['MACRO_CASE'],
    category: 'programming',
    convert: t => t.map(upper).join('_'),
  },
  {
    id: 'kebab-case',
    name: 'kebab-case',
    category: 'programming',
    convert: t => t.map(lower).join('-'),
  },
  {
    id: 'screaming-kebab-case',
    name: 'SCREAMING-KEBAB-CASE',
    aliases: ['COBOL-CASE'],
    category: 'programming',
    convert: t => t.map(upper).join('-'),
  },
  {
    id: 'train-case',
    name: 'Train-Case',
    aliases: ['HTTP-Header-Case'],
    category: 'programming',
    convert: t => t.map(capitalize).join('-'),
  },
  {
    id: 'dot-case',
    name: 'dot.case',
    category: 'programming',
    convert: t => t.map(lower).join('.'),
  },
  {
    id: 'path-case',
    name: 'path/case',
    category: 'programming',
    convert: t => t.map(lower).join('/'),
  },
  {
    id: 'flatcase',
    name: 'flatcase',
    category: 'programming',
    convert: t => t.map(lower).join(''),
  },
  {
    id: 'upper-flatcase',
    name: 'UPPERFLATCASE',
    category: 'programming',
    convert: t => t.map(upper).join(''),
  },
  {
    id: 'ada-case',
    name: 'Ada_Case',
    category: 'programming',
    convert: t => t.map(capitalize).join('_'),
  },
  {
    id: 'namespace-case',
    name: 'Namespace\\Case',
    aliases: ['PHP'],
    category: 'programming',
    convert: t => t.map(capitalize).join('\\'),
  },
  {
    id: 'package-case',
    name: 'Package::Case',
    aliases: ['C++'],
    category: 'programming',
    convert: t => t.map(capitalize).join('::'),
  },
  {
    id: 'reverse-domain-case',
    name: 'reverse.domain.case',
    category: 'programming',
    convert: t => [...t].reverse().map(lower).join('.'),
  },
];

// Pre‑filtered arrays for the UI
export const COMMON_CASES = CASE_DEFINITIONS.filter(
  d => d.category === 'common'
);
export const PROGRAMMING_CASES = CASE_DEFINITIONS.filter(
  d => d.category === 'programming'
);
