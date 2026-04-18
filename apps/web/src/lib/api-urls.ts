import { env } from '@/env';

const BASE_URL = env.API_BASE_URL;

export const TIMESHEET_URLS = {
  AUTH: `${BASE_URL}/timesheet/auth`,
  LOGWORK: `${BASE_URL}/timesheet/logwork`,
  PROJECTS: `${BASE_URL}/timesheet/projects`,
  WORKLOGS_WARNING: `${BASE_URL}/timesheet/project-worklogs-warning`,
  ISSUE: `${BASE_URL}/timesheet/issue`,
  WORKLOGS: `${BASE_URL}/timesheet/worklogs`,
  PROJECT_WORKLOGS: `${BASE_URL}/timesheet/project-worklogs`,
  PROJECT_WORKLOGS_PAGINATION: `${BASE_URL}/timesheet/project-worklogs/pagination`,
  PROJECT_WORKLOGS_REPORT: `${BASE_URL}/timesheet/project-worklogs-report/get-all`,
};

export const URLIFY_URLS = {
  SHORTEN: `${BASE_URL}/urlify/shorten`,
  URLS: `${BASE_URL}/urlify/urls`,
  URL: `${BASE_URL}/urlify/url`,
};

export const OPENAI_URL = `${BASE_URL}/openai`;

export const AUTOLOG_URLS = {
  CONFIGS: `${BASE_URL}/timesheet/autolog`,
  CONFIG: (id: string) => `${BASE_URL}/timesheet/autolog/${id}`,
  RUN: (id: string) => `${BASE_URL}/timesheet/autolog/${id}/run`,
};
