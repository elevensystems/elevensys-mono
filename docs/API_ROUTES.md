# API Routes Reference

> Auto-generated documentation for all Next.js API routes in `elevensys-mono`.

## Authentication (`/api/auth`)

| Method | Route                | Description                                                                                                                      |
| ------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/auth/login`    | Initiates OAuth login flow by redirecting to Cognito. Generates PKCE code verifier and OAuth state cookies.                      |
| `GET`  | `/api/auth/callback` | OAuth callback handler. Exchanges authorization code for tokens (`id_token`, `refresh_token`) and sets secure HTTP-only cookies. |
| `GET`  | `/api/auth/logout`   | Clears auth cookies and redirects to Cognito logout endpoint.                                                                    |
| `GET`  | `/api/auth/session`  | Returns non-sensitive user info derived from the `id_token` for the authenticated session.                                       |

## Timesheet (`/api/timesheet`)

| Method | Route                                        | Description                                                                                                                                                                            |
| ------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/timesheet/auth`                        | Verifies Jira token validity. Auth via `Authorization` header. Query: optional `jiraInstance`. Returns `authentication` and `refresh` tokens on success.                               |
| `POST` | `/api/timesheet/logwork`                     | Logs a work entry to Jira via CDK backend. Auth via `Authorization` header. Body: `worklog` and `jiraInstance`.                                                                        |
| `POST` | `/api/timesheet/worklogs`                    | Fetches user worklogs for a date range. Auth via `Authorization` header. Body: `username`, `fromDate`, `toDate`, and `jiraInstance`.                                                   |
| `POST` | `/api/timesheet/worklogs/delete`             | Deletes a timesheet entry. Auth via `Authorization` header. Body: `issueId`, `timesheetId`, and `jiraInstance`.                                                                        |
| `POST` | `/api/timesheet/worklogs-warning`            | Generates project worklogs warning report. Auth via `Authorization` header. Body: `pid`, `startDate`, `endDate`, and optional `jiraInstance`.                                          |
| `GET`  | `/api/timesheet/projects`                    | Fetches all Jira projects. Auth via `Authorization` header. Query: optional `jiraInstance`.                                                                                            |
| `POST` | `/api/timesheet/projects`                    | Fetches Jira issues using JQL. Auth via `Authorization` header. Body: `jql` (required), `jiraInstance`, `columnConfig`, `layoutKey`, and `startIndex`. Filters to Sub-task types only. |
| `GET`  | `/api/timesheet/projects/{projectId}/issues` | Fetches issues for a specific Jira project. Auth via `Authorization` header. Query: optional `jiraInstance` and `startIndex`. Filters to Sub-task types only.                          |
| `POST` | `/api/timesheet/issue/{issueId}`             | Fetches details for a specific Jira issue by ID. Auth via `Authorization` header. Body: `jiraInstance`.                                                                                |

## Tools & Services

| Method | Route              | Description                                                                                                                                                                |
| ------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/urlify`      | Creates shortened URLs. Accepts `originalUrl`, `createdBy`, `autoDelete`, and `ttlDays`. Returns `shortUrl`, `shortCode`, `originalUrl`, `createdAt`, and `expiresAt`.     |
| `POST` | `/api/translately` | Translates text between Vietnamese and English using OpenAI. Requires `pro` role. Accepts `input`, `direction` (`vi-en` or `en-vi`), optional `tone`, and `model`.         |
| `POST` | `/api/beatly`      | Recommends 5 songs based on user mood using OpenAI. Accepts `mood`, `language`, `genres[]`, and excluded songs. Returns song objects with `title`, `artist`, and `reason`. |
| `POST` | `/api/passly`      | Generates random passwords. Accepts `length` (8-128) and character options (`uppercase`, `lowercase`, `numbers`, `symbols`). Returns array of 4 passwords.                 |
| `GET`  | `/api/templates`   | Returns a list of AI prompt templates. Requires `pro` role. Loads template content from markdown files in `public/templates/`.                                             |

## General

| Method | Route           | Description                                                                 |
| ------ | --------------- | --------------------------------------------------------------------------- |
| `POST` | `/api/feedback` | Submits user feedback. Requires `name`, `email` (validated), and `message`. |

## Summary

- **Total routes:** 18
- **Auth:** OAuth 2.0 with PKCE via AWS Cognito
- **Role-based access:** `templates` and `translately` require `pro` role
- **Timesheet proxy:** Routes forward requests to CDK backend at `api.elevensys.dev`
