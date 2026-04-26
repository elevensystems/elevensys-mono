# Eleven Systems Monorepo

A monorepo containing applications and packages built with Next.js, React, Tailwind CSS v4, and Turborepo.

## Workspace Structure

- `apps/web`: The main consumer-facing Next.js application (Port 3000).
- `apps/admin`: The administrative Next.js application (Port 3002).
- `packages/ui`: Shared UI components using shadcn/ui and Tailwind CSS.

## Timesheet

A Jira timesheet management feature for logging and reviewing work entries.

| Page                  | Route                         | Description                                              |
| --------------------- | ----------------------------- | -------------------------------------------------------- |
| **Log Work**          | `/timesheet/logwork`          | Find missing dates and bulk-log work entries to Jira     |
| **My Worklogs**       | `/timesheet/worklogs`         | View and manage your own worklogs grouped by date        |
| **Project Worklogs**  | `/timesheet/project-worklogs` | View all worklogs for a project with filtering           |
| **Configuration**     | `/timesheet/config`           | Set Jira instance, username, and API token               |

### Log Work — Bulk Date Range Submission

The Log Work page groups consecutive selected dates into ranges and submits one API request per range per entry (instead of one per date). For example, selecting Mon–Fri produces a single request with `startDate: "4/May/26"` and `endDate: "8/May/26"`.

**Important constraint**: the backend logs for every calendar day in the range and rejects the entire range if any date is a holiday or weekend. The grouping logic therefore only merges dates that are exactly 1 calendar day apart, ensuring weekends and holidays never fall within a range boundary.

## Tools

| Tool                 | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| **Urlify**           | Shorten long URLs to make them easier to share and manage    |
| **JSON Diffinity**   | Compare two JSON payloads with editor-style highlighting     |
| **JSON Lens**        | Explore and navigate deeply nested JSON structures           |
| **JSON Objectify**   | Transform JSON into clean JavaScript object notation         |
| **Caseify**          | Convert text between camelCase, snake_case, PascalCase, etc. |
| **Translately**      | Translate between Vietnamese and English with tone control   |
| **Passly**           | Generate secure, random passwords with customizable options  |
| **NPM Converter**    | Convert Lerna publish output to npm install commands         |
| **PR Link Shrinker** | Shorten GitHub PR URLs to a compact, readable format         |
| **Prompt Templates** | Browse and copy prompt templates for AI agents and workflows |
| **Beatly**           | Get song recommendations based on your favorite artists      |

## Prerequisites

- Node.js 20+
- pnpm

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd elevensys-mono
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```
COGNITO_DOMAIN=         # Cognito Hosted UI domain
COGNITO_CLIENT_ID=      # Cognito OAuth client ID
COGNITO_REGION=us-east-1
```

4. Run the development server:

```bash
pnpm run dev
```

This will concurrently start all applications in the monorepo using Turborepo.
- **Web App**: Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Admin App**: Open [http://localhost:3002](http://localhost:3002) in your browser.

Alternatively, to run a specific app:
```bash
pnpm --filter elevensys-admin dev
pnpm --filter elevensys-web dev
```
## Scripts

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `pnpm run dev`      | Start the development server (Turbopack) |
| `pnpm run build`    | Create a production build                |
| `pnpm start`        | Start the production server              |
| `pnpm run lint`     | Run ESLint                               |
| `pnpm run format`   | Format code with Prettier                |

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI, shadcn/ui
- **Auth:** AWS Cognito (OAuth 2.0 + PKCE)
