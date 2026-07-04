/**
 * Response shapes for the claude-watch API (elevensys-core, route prefix
 * `/claude-watch`). Field names mirror the backend query service exactly.
 */

export interface DateRange {
  from: string;
  to: string;
}

export interface SeriesPoint {
  date: string;
  costUSD: number;
  tokens: number;
}

export interface TokenBreakdown {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface SessionSummary {
  sessionId: string;
  developerId: string | null;
  project: string | null;
  branch: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number;
  turns: number;
  subagentTurns: number;
  prompts: number;
  costUSD: number;
  tokens: number;
  modelsUsed: string[];
  toolsUsed: string[];
}

// -- Overview -----------------------------------------------------------------

export interface OverviewResponse {
  range: DateRange;
  totals: {
    costUSD: number;
    tokens: number;
    sessions: number;
    turns: number;
    subagentTurns: number;
    activeDevelopers: number;
  };
  change: {
    costUSDPct: number | null;
    tokensPct: number | null;
    sessionsPct: number | null;
  };
  series: SeriesPoint[];
}

// -- Developers ---------------------------------------------------------------

export type DeveloperSort = 'cost' | 'tokens' | 'sessions' | 'turns';

export interface DeveloperRow {
  developerId: string;
  costUSD: number;
  tokens: TokenBreakdown;
  sessions: number;
  turns: number;
  subagentTurns: number;
  avgSessionDurationMs: number;
  avgTurnsPerSession: number;
  mostUsedModel: string | null;
  mostUsedTool: string | null;
  projectsTouched: string[];
  lastActive: string | null;
}

export interface DevelopersResponse {
  range: DateRange;
  sortBy: string;
  developers: DeveloperRow[];
}

export interface ModelBreakdownItem {
  key: string;
  costUSD: number;
  tokens: number;
  pct: number;
}

export interface ToolBreakdownItem {
  tool: string;
  count: number;
  failures: number;
  successRate: number;
  pct: number;
}

export interface DeveloperDetail {
  developerId: string;
  range: DateRange;
  series: SeriesPoint[];
  modelBreakdown: ModelBreakdownItem[];
  toolBreakdown: ToolBreakdownItem[];
  topProjects: { project: string; costUSD: number }[];
  recentSessions: SessionSummary[];
  topBashCategories: { category: string; count: number }[];
  promptCategories: { category: string; count: number; costUSD: number }[];
  compactionCount: number;
  errorCount: number;
  deniedToolCount: number;
}

// -- Projects -----------------------------------------------------------------

export interface ProjectRow {
  repo: string;
  costUSD: number;
  sessions: number;
  turns: number;
  contributors: string[];
}

export interface ProjectsResponse {
  range: DateRange;
  projects: ProjectRow[];
}

export interface ProjectDetail {
  repo: string;
  range: DateRange;
  series: SeriesPoint[];
  contributors: { developerId: string; costUSD: number; sharePct: number }[];
  branches: string[];
  filesMostEdited: { file: string; edits: number }[];
}

// -- Sessions -----------------------------------------------------------------

export interface SessionsResponse {
  range: DateRange;
  sessions: SessionSummary[];
  nextCursor: string | null;
}

export interface UsageEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  developerId: string;
  payload: Record<string, unknown>;
}

export interface SessionDetail {
  sessionId: string;
  summary: SessionSummary | null;
  events: UsageEvent[];
}

// -- Models / Tools / Prompt categories ---------------------------------------

export interface UserCost {
  developerId: string;
  costUSD: number;
}

export interface ModelRow {
  model: string;
  costUSD: number;
  tokens: number;
  pctOfTotal: number;
  topUsers: UserCost[];
}

export interface ModelsResponse {
  range: DateRange;
  models: ModelRow[];
}

export interface ToolRow {
  tool: string;
  count: number;
  failures: number;
  successRate: number;
  byDeveloper: { developerId: string; count: number }[];
}

export interface ToolsResponse {
  range: DateRange;
  tools: ToolRow[];
}

export interface PromptCategoryRow {
  category: string;
  count: number;
  costUSD: number;
  pctOfCost: number;
  topUsers: UserCost[];
}

export interface PromptCategoriesResponse {
  range: DateRange;
  categories: PromptCategoryRow[];
}
