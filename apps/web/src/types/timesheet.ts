export interface RowErrors {
  issueKey?: string;
  description?: string;
}

export interface ValidationErrors {
  global: {
    dates?: string;
    config?: string;
    entries?: string;
  };
  rows: Map<string, RowErrors>;
}

export const WORK_TYPES = [
  'Create',
  'Review',
  'Study',
  'Correct',
  'Translate',
  'Test',
] as const;

export type WorkType = (typeof WORK_TYPES)[number];

export interface WorkEntry {
  id: string;
  issueKey: string;
  typeOfWork: WorkType;
  description: string;
  hours: number;
}

export interface WorklogPayload {
  username: string;
  issueKey: string;
  timeSpend: number;
  startDate: string;
  endDate: string;
  typeOfWork: string;
  description: string;
  time: string;
  remainingTime: number;
  period: boolean;
}

export interface WorklogEntry {
  id: number;
  issueKey: string;
  issueId: number;
  worked: number;
  remaining: number;
  estimated: number;
  startDate: string;
  startDateEdit: string;
  description: string;
  author: string;
  typeOfWork: string;
  statusWorklog: string;
}

export interface LogWorkRequest {
  worklog: WorklogPayload;
  jiraInstance: string;
}

export interface FetchWorklogsRequest {
  username: string;
  fromDate: string;
  toDate: string;
  jiraInstance: string;
}

export interface TimesheetAuthData {
  authentication: string;
  refresh: string;
}

export interface TimesheetSettings {
  username: string;
  token: string;
  jiraInstance: string;
  authData?: TimesheetAuthData;
}

export interface LogWorkResult {
  entry: WorkEntry;
  success: boolean;
  error?: string;
  failedDates?: string[];
}

export type RequestStatusState =
  | 'pending'
  | 'in-progress'
  | 'success'
  | 'failed'
  | 'skipped';

export interface RequestStatus {
  entryId: string;
  issueKey: string;
  date: string;
  status: RequestStatusState;
  error?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface WorklogsWarningEntry {
  key: string;
  value: string;
}

export interface JiraIssueType {
  description: string;
  name: string;
  iconUrl: string;
}

export interface JiraIssue {
  id: number;
  key: string;
  status: string;
  summary: string;
  type: JiraIssueType;
  typeOfWork?: string;
}

export interface ProjectWorklogRow {
  no: number;
  id: number;
  key: string;
  component: string;
  summary: string;
  user: string;
  projectId: number;
  date: string;
  description: string;
  worked: string;
  attribute: string;
  attributeValue: string;
  status: string;
  issuetype: string;
  projectname: string;
  productName: string;
  warningAbsence: boolean;
}

export interface ProjectWorklogsData {
  page: number;
  total: number;
  records: number;
  start: number;
  end: number;
  rows: ProjectWorklogRow[];
}

export interface MyWorklogsRow {
  id: number;
  typeIssueName: string;
  issueKey: string;
  issueId: number;
  summary: string;
  statusName: string;
  statusIssue: string;
  startDate: string;
  startDateEdit: string;
  description: string;
  author: string;
  typeOfWork: string;
  estimated: string;
  remain: string;
  worked: string;
  statusWorklog: string;
  isDayOff: boolean;
  isEdit: boolean;
  avatarId: string;
}

export interface UpdateWorklogRequest {
  id: number;
  startDateEdit?: string;
  description?: string;
  typeOfWork?: string;
  worked?: string;
  jiraInstance: string;
}

export interface MyWorklogsData {
  rows: MyWorklogsRow[];
  records: number;
  start: number;
  pageSize: number;
  end: number;
}
