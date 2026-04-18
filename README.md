# Eleven Systems Monorepo

A monorepo containing applications and packages built with Next.js, React, Tailwind CSS v4, and Turborepo.

## Workspace Structure

- `apps/web`: The main consumer-facing Next.js application (Port 3000).
- `apps/admin`: The administrative Next.js application (Port 3002).
- `packages/ui`: Shared UI components using shadcn/ui and Tailwind CSS.

## Tools

| Tool                 | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| **Urlify**           | Shorten long URLs to make them easier to share and manage    |
| **JSON Diffinity**   | Compare two JSON payloads with editor-style highlighting     |
| **JSON Objectify**   | Transform JSON into clean JavaScript object notation         |
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
