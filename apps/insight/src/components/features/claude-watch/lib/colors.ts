/**
 * Categorical colors for models / tools / prompt categories / events, plus the
 * coral "cost" accent. Neutral chrome (grid lines, tracks, text) is pulled from
 * theme tokens in the chart components so light/dark still works.
 */

export const PALETTE = {
  coral: '#E07B54',
  blue: '#5B8DEF',
  green: '#4FB477',
  purple: '#9B7EDE',
  teal: '#45C4B0',
  yellow: '#E8C547',
  orange: '#E8924A',
  slate: '#8893A6',
  red: '#E0574E',
} as const;

/** Accent for cost throughout the tracker. */
export const COST = PALETTE.coral;

/** A rotating palette for ad-hoc categorical series (e.g. bash categories). */
export const SERIES_COLORS = [
  PALETTE.blue,
  PALETTE.green,
  PALETTE.purple,
  PALETTE.teal,
  PALETTE.orange,
  PALETTE.slate,
];

export const modelColor = (model: string): string => {
  if (/opus/i.test(model)) return PALETTE.purple;
  if (/haiku/i.test(model)) return PALETTE.teal;
  if (/sonnet/i.test(model)) return PALETTE.coral;
  return PALETTE.slate;
};

export const toolColor = (tool: string): string =>
  ({
    Bash: PALETTE.orange,
    Read: PALETTE.blue,
    Edit: PALETTE.green,
    Write: PALETTE.purple,
    Grep: PALETTE.teal,
    Glob: PALETTE.slate,
    WebFetch: PALETTE.yellow,
    Task: PALETTE.coral,
  })[tool] ?? PALETTE.slate;

export const catColor = (category: string): string =>
  ({
    feature: PALETTE.blue,
    'bug-fix': PALETTE.red,
    refactor: PALETTE.purple,
    test: PALETTE.green,
    docs: PALETTE.teal,
    question: PALETTE.slate,
    devops: PALETTE.orange,
    review: '#00B4D8',
    performance: '#9DC209',
    security: '#D6336C',
    debug: '#6C5CE7',
    design: '#E07BB8',
    data: '#B5835A',
    dependencies: '#7A89C2',
    chore: PALETTE.yellow,
    other: '#6f7686',
    uncategorized: '#54545c',
  })[category] ?? PALETTE.slate;

export const evtColor = (eventType: string): string =>
  ({
    SessionStart: PALETTE.green,
    SessionEnd: PALETTE.slate,
    UserPromptSubmit: PALETTE.blue,
    Stop: PALETTE.purple,
    SubagentStop: PALETTE.purple,
    PostToolUse: PALETTE.teal,
    PostToolUseFailure: PALETTE.red,
    PreCompact: PALETTE.yellow,
    PostCompact: PALETTE.yellow,
    PermissionDenied: PALETTE.orange,
  })[eventType] ?? PALETTE.slate;

/** Hex color -> rgba() string with the given alpha. */
export const hexA = (hex: string, alpha: number): string => {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Color for a success-rate value: green >= 95, yellow >= 80, else red. */
export const successColor = (rate: number): string =>
  rate >= 95 ? PALETTE.green : rate >= 80 ? PALETTE.yellow : PALETTE.red;
