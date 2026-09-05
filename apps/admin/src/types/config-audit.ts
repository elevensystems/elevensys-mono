/** Newest-first change log length. Keeps the Global Config item small. */
export const HISTORY_LIMIT = 20;

/**
 * One recorded change in the shared `config-audit` log, newest first.
 *
 * Every config feature edited from this app writes here, tagged with `feature`
 * so each editor can show only its own history.
 */
export interface ConfigAuditEntry {
  /** ISO 8601 instant the change was saved. */
  at: string;
  /** Display name of the staff member who saved it. */
  by: string;
  /** Config feature the entry belongs to, e.g. `site-banner`. */
  feature: string;
  /** Which slice of the feature changed, when it has more than one. */
  target?: string;
  action: 'save' | 'clear';
  /** Short human-readable description, e.g. the first line of the message. */
  summary: string;
}
