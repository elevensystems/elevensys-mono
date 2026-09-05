import type { ConfigAuditEntry } from '@/types/config-audit';

/** Everything the tools-visibility editor needs to render. */
export interface ToolsVisibilitySnapshot {
  /** Visible tool paths, or `null` when every tool is shown. */
  visible: string[] | null;
  history: ConfigAuditEntry[];
  /** False when the Global Config store or API token is not configured. */
  configured: boolean;
}
