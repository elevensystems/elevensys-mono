/** Display formatters for claude-watch metrics (ported from the design). */

/** Currency: $X.XX for >= 1, trimmed fractional cents below. */
export const fc = (v: number | null | undefined): string => {
  if (v == null) return '—';
  if (v >= 1) return `$${v.toFixed(2)}`;
  const s = v
    .toFixed(6)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
  return `$${s === '' ? '0' : s}`;
};

/** Full 6-decimal currency, used in the session timeline. */
export const fc6 = (v: number): string => `$${v.toFixed(6)}`;

/** Token counts as compact K/M. */
export const ft = (n: number): string => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `${n}`;
};

/** Duration in ms -> "1h 4m" / "12m 30s" / "8s". */
export const fd = (ms: number): string => {
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${ss ? `${ss}s` : ''}`.trim();
  return `${ss}s`;
};

/** Relative time from now, e.g. "5m ago". */
export const rel = (iso: string | null): string => {
  if (!iso) return '—';
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.round(d)}s ago`;
  if (d < 3600) return `${Math.round(d / 60)}m ago`;
  if (d < 86400) return `${Math.round(d / 3600)}h ago`;
  return `${Math.round(d / 86400)}d ago`;
};

export const shortId = (id: string, len = 8): string => id.slice(0, len);

export const sum = (nums: number[]): number => nums.reduce((a, b) => a + b, 0);
