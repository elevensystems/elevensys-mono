import { env } from '@/env';

const BASE_URL = env.API_BASE_URL;
const JIRA_BASE = `${BASE_URL}/jira`;

export const JIRA_URLS = {
  AUTH_CHECK: `${JIRA_BASE}/auth/check`,
  LOGWORK: `${JIRA_BASE}/worklogs/logwork`,
  WORKLOGS: `${JIRA_BASE}/worklogs`,
  PROJECTS: `${JIRA_BASE}/projects`,
  PROJECTS_SEARCH: `${JIRA_BASE}/projects/search`,
  ISSUE: `${JIRA_BASE}/issues`,
  PROJECT_WORKLOGS: `${JIRA_BASE}/project-worklogs`,
  PROJECT_WORKLOGS_PAGINATION: `${JIRA_BASE}/project-worklogs/pagination`,
  PROJECT_WORKLOGS_WARNING: `${JIRA_BASE}/project-worklogs/warning`,
  PROJECT_WORKLOGS_REPORT: `${JIRA_BASE}/project-worklogs/report`,
};

export const URLIFY_URLS = {
  SHORTEN: `${BASE_URL}/urlify/shorten`,
  URLS: `${BASE_URL}/urlify/urls`,
  URL: `${BASE_URL}/urlify/url`,
};

export const OPENAI_URL = `${BASE_URL}/openai`;

export const AUTOLOG_URLS = {
  CONFIGS: `${JIRA_BASE}/autolog`,
  CONFIG: (id: string) => `${JIRA_BASE}/autolog/${id}`,
  RUN: (id: string) => `${JIRA_BASE}/autolog/${id}/run`,
};
