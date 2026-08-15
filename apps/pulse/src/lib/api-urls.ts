import { env } from '@/env';

const BASE_URL = env.API_BASE_URL;
const JIRA_BASE = `${BASE_URL}/jira`;

export const JIRA_URLS = {
  AUTH_CHECK: `${JIRA_BASE}/auth/check`,
  LOGWORK: `${JIRA_BASE}/worklogs/logwork`,
  WORKLOGS: `${JIRA_BASE}/worklogs`,
  PROJECTS: `${JIRA_BASE}/projects`,
  ISSUES_SEARCH: `${JIRA_BASE}/issues/search`,
  PROJECT_WORKLOGS: `${JIRA_BASE}/project-worklogs`,
  PROJECT_WORKLOGS_PAGINATION: `${JIRA_BASE}/project-worklogs/pagination`,
  PROJECT_WORKLOGS_WARNING: `${JIRA_BASE}/project-worklogs/warning`,
  PROJECT_WORKLOGS_WARNING_ALL: `${JIRA_BASE}/project-worklogs/warning/all`,
  PROJECT_WORKLOGS_REPORT: `${JIRA_BASE}/project-worklogs/report`,
  ABSENCES: `${JIRA_BASE}/absences`,
  ABSENCES_PAGE_INFO: `${JIRA_BASE}/absences/page-info`,
};

export const AUTOLOG_URLS = {
  CONFIGS: `${JIRA_BASE}/autolog`,
  CONFIG: (id: string) => `${JIRA_BASE}/autolog/${id}`,
  RUN: (id: string) => `${JIRA_BASE}/autolog/${id}/run`,
};
