# CLAUDE.md - AI Assistant Guide for Elevensys Mono

This document provides comprehensive guidance for AI assistants working with the Elevensys Mono
codebase.

## Project Overview

**Elevensys Mono** is a Turborepo monorepo containing multiple Next.js applications and shared
packages. It provides AI-powered productivity tools and an admin dashboard. Built with Next.js 16
(App Router), React 19, and TypeScript 7, using pnpm workspaces for dependency management.

### Monorepo Structure

| Workspace      | Package Name        | Description                                | Port |
| -------------- | ------------------- | ------------------------------------------ | ---- |
| `apps/web`     | `elevensys-web`     | Main web app with developer tools and auth | 3000 |
| `apps/admin`   | `elevensys-admin`   | Admin dashboard (newly scaffolded)         | 3002 |
| `apps/insight` | `elevensys-insight` | Internal insight dashboard                 | 3003 |
| `apps/pulse`   | `elevensys-pulse`   | Jira timesheet & worklog app               | 3004 |
| `packages/ui`  | `@workspace/ui`     | Shared UI components (shadcn/ui + Radix)   | —    |

### Quick Start

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start ALL apps in parallel via Turbo
pnpm dev

# Start a specific app
pnpm --filter elevensys-web dev
pnpm --filter elevensys-admin dev
pnpm --filter elevensys-pulse dev

# Build all apps
pnpm build

# Run linting across all apps
pnpm lint

# Format code (root-level Prettier)
pnpm format

# Run tests (in a specific app)
pnpm --filter elevensys-web test
pnpm --filter elevensys-web test:coverage
```

## Tech Stack

| Category        | Technology                         |
| --------------- | ---------------------------------- |
| Monorepo        | Turborepo + pnpm workspaces        |
| Framework       | Next.js 16 (App Router, Turbopack) |
| UI Library      | React 19                           |
| Language        | TypeScript 7 (strict mode)         |
| Styling         | Tailwind CSS v4                    |
| Components      | shadcn/ui + Radix UI primitives    |
| Icons           | lucide-react                       |
| Editor          | Monaco Editor                      |
| Auth            | AWS Cognito OAuth2 (PKCE)          |
| Theming         | next-themes                        |
| Notifications   | sonner                             |
| Forms           | @tanstack/react-form               |
| Package Manager | pnpm 10                            |

### TypeScript 7 toolchain

`tsc` is TypeScript 7 (the native compiler) and `tsc6` is TypeScript 6, installed side by side:

```json
"@typescript/native": "npm:typescript@^7.0.2",
"typescript": "npm:@typescript/typescript6@^6.0.2"
```

The `typescript` name is aliased to the 6.0 package because typescript-eslint cannot load the TS 7
API yet ([#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)) — it throws
at import time on TS >= 7. Anything resolving `typescript` as a module (ESLint, editors) gets the
6.0 API; `pnpm type-check` runs the real TS 7 binary.

`@typescript/typescript6` ships `bin/tsc6`, not `bin/tsc`, which Next's CLI type-check path
requires, so every app sets `experimental.useTypeScriptCli: false` to type-check through the TS API
during `next build`. Drop that flag (and the alias) once typescript-eslint supports TS 7.

`baseUrl` was removed in TS 7 — use `paths` instead.

## Directory Structure

```
elevensys-mono/
├── apps/
│   ├── web/                        # Main web application (elevensys-web)
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router
│   │   │   │   ├── api/            # API route handlers
│   │   │   │   │   ├── auth/       # OAuth2 endpoints (login, callback, logout, session, signup)
│   │   │   │   │   ├── beatly/     # Song recommender API
│   │   │   │   │   ├── passly/     # Password generator API
│   │   │   │   │   ├── translately/# Translation API (Pro-only)
│   │   │   │   │   ├── urlify/     # URL shortener create endpoint
│   │   │   │   │   └── feedback/
│   │   │   │   ├── tools/          # Tool pages (9 tools)
│   │   │   │   │   ├── beatly/         # Song recommender
│   │   │   │   │   ├── caseify/        # Case converter
│   │   │   │   │   ├── json-diffinity/ # JSON diff tool
│   │   │   │   │   ├── json-lens/      # JSON viewer
│   │   │   │   │   ├── json-objectify/ # JSON object converter
│   │   │   │   │   ├── npm-converter/
│   │   │   │   │   ├── passly/         # Password generator
│   │   │   │   │   ├── translately/    # Translation tool
│   │   │   │   │   └── urlify/         # URL shortener
│   │   │   │   ├── login/          # Login page
│   │   │   │   ├── signup/         # Sign up page
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── profile/        # User profile page
│   │   │   │   ├── layout.tsx      # Root layout with providers
│   │   │   │   └── page.tsx        # Homepage
│   │   │   ├── components/
│   │   │   │   ├── layouts/        # Layout components (main-layout, app-sidebar, nav-*, etc.)
│   │   │   │   ├── features/       # Feature-specific components (auth)
│   │   │   │   ├── header.tsx
│   │   │   │   └── theme-provider.tsx
│   │   │   ├── contexts/
│   │   │   │   ├── auth-context.tsx    # Auth state via React Context
│   │   │   │   └── visible-tools-context.tsx  # Which tools the sidebar shows
│   │   │   ├── hooks/              # Custom hooks (use-action-feedback, use-url-history)
│   │   │   ├── lib/                # Utilities, configs, schemas
│   │   │   ├── types/              # Shared type definitions
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── public/
│   │   │   └── assets/             # SVG icons, favicon
│   │   ├── jest.config.ts
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin/                      # Admin dashboard (elevensys-admin)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx      # Root layout (Ubuntu font, ThemeProvider)
│   │   │   │   └── page.tsx        # Admin dashboard page
│   │   │   ├── components/
│   │   │   │   └── theme-provider.tsx
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── insight/                    # Internal insight dashboard (elevensys-insight)
│   │
│   └── pulse/                      # Jira timesheet & worklog app (elevensys-pulse)
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/jira/       # Proxy routes to backend Jira API (12 routes)
│       │   │   ├── page.tsx        # Landing page (feature cards)
│       │   │   ├── config/         # Jira credentials settings
│       │   │   ├── timesheet/      # logwork, my-worklogs, project-worklogs
│       │   │   │                   #   (each with page-local _components)
│       │   │   ├── worklog-management/  # Hidden page (direct URL only)
│       │   │   └── autolog/        # Autolog configs (list, new, edit)
│       │   ├── components/
│       │   │   ├── layouts/        # main-layout, app-sidebar, nav-*, tool-page-header
│       │   │   └── features/       # timesheet + autolog shared components
│       │   ├── hooks/              # 10 timesheet/autolog hooks
│       │   ├── lib/                # timesheet.ts, api-urls, jira-proxy, fetch-utils
│       │   └── types/              # timesheet.ts, autolog.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── ui/                         # Shared UI package (@workspace/ui)
│       ├── src/
│       │   ├── components/         # 42 shadcn/ui components
│       │   ├── hooks/              # Shared hooks (use-mobile.ts)
│       │   ├── lib/                # Shared utilities (cn(), hasRole())
│       │   └── styles/
│       │       └── globals.css     # Shared CSS variables, theme tokens
│       ├── components.json         # shadcn/ui config
│       ├── package.json
│       └── tsconfig.json
│
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml             # Workspace: apps/*, packages/*
├── package.json                    # Root scripts (dev, build, lint, format)
├── .prettierrc.json                # Shared Prettier config
├── commitlint.config.ts
└── .github/                        # Dev guidelines (repo, copilot, nextjs instructions)
```

## Workspace Architecture

### Package Dependencies

```
apps/web     ──depends on──▶  @workspace/ui
apps/admin   ──depends on──▶  @workspace/ui
apps/insight ──depends on──▶  @workspace/ui
apps/pulse   ──depends on──▶  @workspace/ui
```

All apps declare `"@workspace/ui": "workspace:*"` in their `package.json` and configure
`transpilePackages: ['@workspace/ui']` in `next.config.ts`.

### Shared UI Package (`@workspace/ui`)

The `packages/ui` package exports via the `exports` field in `package.json`:

```json
{
  "exports": {
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts",
    "./lib/*": "./src/lib/*.ts",
    "./globals.css": "./src/styles/globals.css"
  }
}
```

**Import patterns from apps:**

```tsx
// Components
import { Button } from '@workspace/ui/components/button';
import { Sidebar } from '@workspace/ui/components/sidebar';
import { Toaster } from '@workspace/ui/components/sonner';
// Styles (in app's globals.css or layout)
import '@workspace/ui/globals.css';
// Hooks
import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
// Utilities
import { cn, hasRole } from '@workspace/ui/lib/utils';
```

### Adding shadcn/ui Components

```bash
# Add to the shared UI package (preferred)
cd packages/ui
pnpm dlx shadcn@latest add [component-name]
```

Components are installed to `packages/ui/src/components/`.

## Code Conventions

### Naming

| Type                | Convention       | Example                                  |
| ------------------- | ---------------- | ---------------------------------------- |
| Components          | PascalCase       | `MainLayout`, `ProAccessOnly`            |
| Files/Folders       | kebab-case       | `passly`, `auth-context.tsx`             |
| Variables/Functions | camelCase        | `getUserFromSession`, `handleCopy`       |
| Constants           | UPPER_SNAKE_CASE | `AUTH_COOKIES`, `COPY_FEEDBACK_DURATION` |
| Types/Interfaces    | PascalCase       | `AuthUser`, `CharacterOptions`           |

### File Organization

- **Feature-based structure**: Colocate related code within tool/feature directories
- **No barrel files**: Import directly from source files, not via `index.ts` re-exports
- **Type definitions**: Place shared types in `/types` folder, not inside components
- **Utilities**: General helpers go in `/lib` folder
- **Shared UI**: Components used by multiple apps go in `packages/ui`

### Path Aliases

Each app configures its own `@/*` alias in `tsconfig.json`:

```typescript
// Within apps/web or apps/admin:
@/*           → ./src/*
@/components/* → ./src/components/*
@/styles/*    → ./src/styles/*

// Cross-workspace imports use the package name:
@workspace/ui/components/*  → packages/ui/src/components/*
@workspace/ui/hooks/*       → packages/ui/src/hooks/*
@workspace/ui/lib/*         → packages/ui/src/lib/*
```

### Component Patterns

```tsx
// Always use 'use client' directive for client components
'use client';

// Import order (enforced by Prettier):
// 1. React imports
// 2. Next.js imports
// 3. Third-party libraries
// 4. @workspace/ui imports
// 5. @/ aliased imports (app-local)
// 6. Relative imports
import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import type { AuthUser } from '@/types/auth';

// Always use 'use client' directive for client components

// Define interfaces above component
interface MyComponentProps {
  title: string;
  user?: AuthUser;
}

// Functional components with explicit typing
export default function MyComponent({ title, user }: MyComponentProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = useCallback(async () => {
    // Implementation
  }, []);

  return <MainLayout>{/* Component JSX */}</MainLayout>;
}
```

### Tool Page Pattern (apps/web)

Every tool page follows this structure:

```tsx
'use client';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';

export default function ToolPage() {
  const [error, setError] = useState('');

  return (
    <MainLayout>
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-full mx-auto">
          <ToolPageHeader
            title="Tool Name"
            description="Tool description for SEO and users."
            infoMessage="Optional info message."
            error={error}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Settings/Input Card */}
            {/* Result/Output Card */}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
```

### API Route Pattern (apps/web)

```tsx
import { NextRequest, NextResponse } from 'next/server';

// Define request/response interfaces
interface MyRequest {
  field: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MyRequest = await request.json();

    // Validate input
    if (!body.field) {
      return NextResponse.json({ error: 'Field is required' }, { status: 400 });
    }

    // Process request
    const result = await processData(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## App-Specific Details

### apps/web (elevensys-web)

The main web application with developer tools and authentication. Single-brand (Eleven Systems) —
`APP_NAME` / `APP_DESCRIPTION` live in `src/lib/constants.ts`.

- **Font**: Ubuntu (via `next/font/google`)
- **Auth**: AWS Cognito OAuth2 (PKCE) with `AuthProvider` context
- **Tool visibility**: `VisibleToolsProvider`, fed from Global Config (see below)
- **Providers chain**: `ThemeProvider` → `AuthProvider` → `VisibleToolsProvider` →
  `SiteAnnouncementProvider`
- **Proxy**: `src/proxy.ts` refreshes Cognito tokens and forwards `x-pathname` to layouts

> The Jira timesheet feature previously hosted here (`/timesheet/*`, `/api/jira/*`) now lives
> entirely in `apps/pulse`.

### apps/admin (elevensys-admin)

The admin dashboard application. Currently a minimal scaffold sharing `@workspace/ui`.

- **Font**: Ubuntu (via `next/font/google`) — same as the other apps
- **Port**: 3002 (`next dev -p 3002`)
- **Providers**: `ThemeProvider` only (no auth/domain/flags yet)

### apps/pulse (elevensys-pulse)

The dedicated Jira timesheet app. Contains the timesheet feature migrated from `apps/web` (routes
moved to the app root: `/`, `/timesheet/logwork`, `/timesheet/my-worklogs`,
`/timesheet/project-worklogs`, `/worklog-management` (hidden), `/autolog`, `/config`).

- **Font**: Ubuntu (via `next/font/google`)
- **Port**: 3004 (`next dev -p 3004`)
- **Providers**: `ThemeProvider` → `SiteAnnouncementProvider` — no Cognito
- **Auth**: Jira PAT saved in `localStorage` via `/config`, sent as a `Bearer` header to
  `/api/jira/*` proxy routes (forwarded to `API_BASE_URL`)
- **Env**: `API_BASE_URL` (validated in `src/env.ts`); optional `GLOBAL_CONFIG` for the site banner
- Shared timesheet components live in `src/components/features/timesheet/`; page-private components
  stay in each route's `_components/`

## Authentication System (apps/web)

### Architecture

- **Provider**: AWS Cognito with OAuth2 + PKCE
- **Token Storage**: HttpOnly cookies (`cognito_id_token`, `cognito_refresh_token`)
- **Session**: Server-side JWT decoding in `src/lib/auth.ts`
- **Auth pages**: `/login`, `/signup`, `/forgot-password` (self-contained pages)

### User Roles

```typescript
type UserRole = 'pro' | 'free';
```

- **pro**: Access to premium features (translately, etc.)
- **free**: Basic features only

### Auth Context Usage

```tsx
'use client';

import { hasRole } from '@workspace/ui/lib/utils';

import { useAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { user } = useAuth();

  // Check if user has pro access
  if (hasRole(user, ['pro'])) {
    // Show pro features
  }
}
```

### Pro-Only Feature Gating

```tsx
import { ProAccessOnly } from '@/components/layouts/pro-access-only';

function ProFeaturePage() {
  return <ProAccessOnly>{/* Pro-only content */}</ProAccessOnly>;
}
```

## Styling

### Tailwind CSS v4

- Use utility classes directly in JSX
- Use `cn()` helper from `@workspace/ui/lib/utils` for conditional classes:

```tsx
import { cn } from '@workspace/ui/lib/utils';

<div
  className={cn(
    'base-classes',
    condition && 'conditional-class',
    variant === 'primary' && 'primary-styles'
  )}
/>;
```

### CSS Variables (Theme)

Key variables defined in shared `globals.css`:

```css
--background, --foreground
--primary, --primary-foreground
--secondary, --muted, --accent, --destructive
--border, --ring
--sidebar-*  /* Sidebar-specific colors */
```

### Dark Mode

- Handled by `next-themes` via class-based switching
- Use Tailwind's `dark:` prefix for dark mode styles

## Environment Variables

Required variables (in each app's `.env.local`):

```bash
# AWS Cognito (apps/web)
COGNITO_DOMAIN=
COGNITO_CLIENT_ID=
COGNITO_SCOPES=

# Application
NEXT_PUBLIC_APP_URL=

# External APIs
API_BASE_URL=         # Base URL for backend API (e.g. https://api.elevensys.dev)

# Vercel Global Config (all apps) — injected as EDGE_CONFIG when a store is
# connected to the project. Holds the site announcement banner.
# Optional: when unset, the banner is simply hidden.
GLOBAL_CONFIG=

# Site banner editor (apps/admin only) — needed to WRITE the announcement.
# Never expose these to the client.
VERCEL_API_TOKEN=
VERCEL_TEAM_ID=      # only on a team-scoped store
```

Access pattern:

```typescript
import { requireEnv } from '@/lib/utils';

// Throws if missing
const baseUrl = requireEnv('API_BASE_URL');
```

## Common Tasks

### Adding a New Tool (apps/web)

1. Create directory: `src/app/tools/[tool-name]/page.tsx`
2. Create API route if needed: `src/app/api/[tool-name]/route.ts`
3. Add navigation entry in `src/components/layouts/nav-tools.tsx`
4. Follow the existing tool page pattern with `MainLayout` and `ToolPageHeader`

### Adding a Shared UI Component

```bash
# Install to the shared package
cd packages/ui
pnpm dlx shadcn@latest add [component-name]

# Import from any app
import { ComponentName } from '@workspace/ui/components/component-name';
```

### Creating Types (apps/web)

1. Add type definitions to `src/types/[domain].ts`
2. Export from the type file directly (no barrel files)
3. Import with: `import type { MyType } from '@/types/domain';`

### Adding a Custom Hook

1. **Shared hook** (used by multiple apps): Create in `packages/ui/src/hooks/use-[name].ts`
2. **App-specific hook**: Create in `apps/[app]/src/hooks/use-[name].ts`
3. Follow React hooks naming convention
4. Export the hook function directly

### Running a Specific App

```bash
# Using pnpm filter
pnpm --filter elevensys-web dev
pnpm --filter elevensys-admin dev

# Or using turbo filter
pnpm turbo dev --filter=elevensys-web
```

## Best Practices

### Do

- Use TypeScript strict mode (already enabled)
- Prefer interfaces over types for object shapes
- Use `'use client'` only when necessary (hooks, browser APIs)
- Destructure props in function signature
- Use `useCallback` and `useMemo` for expensive operations
- Handle loading and error states in UI
- Use `toast` from sonner for user notifications
- Keep components small and focused (single responsibility)
- Place shared components in `packages/ui`, app-specific in the app's `components/`
- Use `@workspace/ui/*` imports for shared code, `@/*` for app-local code

### Don't

- Don't use `any` type - use `unknown` and narrow
- Don't create barrel files (`index.ts` re-exports)
- Don't define types inside components
- Don't use array index as React keys for dynamic lists
- Don't mutate state directly - use immutable updates
- Don't use class components (except error boundaries)
- Don't store sensitive data in client-side state
- Don't install shared UI dependencies in individual apps (put them in `packages/ui`)

## Git Commits

- DO NOT include Co-Authored-By trailers in git commit messages.

## Testing

| Category          | Technology                                       |
| ----------------- | ------------------------------------------------ |
| Test Runner       | Jest 30 (via `next/jest`)                        |
| Component Testing | React Testing Library (`@testing-library/react`) |
| User Interactions | `@testing-library/user-event`                    |
| Assertions        | `@testing-library/jest-dom`                      |
| Environment       | jsdom (`jest-environment-jsdom`)                 |

### Commands

```bash
pnpm --filter elevensys-web test                # Run all tests in web app
pnpm --filter elevensys-web test:coverage       # Run tests with coverage report
pnpm --filter elevensys-pulse test              # Run all tests in pulse app
```

### Configuration

- **Jest config**: `jest.config.ts` in each app - uses `next/jest.js` with jsdom environment
- **Setup file**: `jest.setup.ts` - imports `@testing-library/jest-dom`
- **Path alias**: `@/` mapped to `<rootDir>/src/` via `moduleNameMapper`

### Test File Conventions

- Place test files next to the source file: `page.tsx` → `page.test.tsx`
- Test descriptions start with a verb: `renders`, `calls`, `displays`, `hides`, `passes`,
  `disables`, `checks`
- Mock hooks to control component state, mock complex UI components (Radix, layouts) as simple HTML
  elements
- Use `data-testid` on mocked components for reliable selection
- Group related tests with comments: `// --- Loading state ---`, `// --- Search card ---`

### Mocking Strategy

- **Hooks** (`useTimesheetSettings`, `useWorklogs`): Mock at module level with `jest.fn()` to
  control all state
- **Layout components** (`MainLayout`, `ToolPageHeader`): Mock as simple div wrappers rendering
  children/props
- **Child components** (`WorklogRow`, `BulkDeleteAction`): Mock with simplified HTML exposing key
  props via `data-testid`
- **UI components** (`Button`, `Card`, `Table`, `Checkbox`): Mock as native HTML equivalents
- **next/link**: Mock as `<a>` tag
- **lucide-react icons**: Mock as `<span>` with `data-testid`

## Timesheet Feature (apps/pulse)

The timesheet feature lets users log, review, and manage Jira worklogs. It lives entirely in
`apps/pulse` at the app root — it is **not** part of `apps/web`.

### Pages

| Route                         | Page               | Description                                          |
| ----------------------------- | ------------------ | ---------------------------------------------------- |
| `/timesheet/logwork`          | Log Work           | Find missing dates and bulk-log entries to Jira      |
| `/timesheet/my-worklogs`      | My Worklogs        | View personal worklogs grouped by date               |
| `/timesheet/project-worklogs` | Project Worklogs   | View all worklogs for a project with filters         |
| `/timesheet/missing-worklogs` | Missing Worklogs   | See who on a project has not logged work for a range |
| `/worklog-management`         | Worklog Management | Bulk edit/delete worklogs (hidden — direct URL only) |
| `/autolog`                    | Autolog            | Manage recurring auto-log configurations             |
| `/absences`                   | Absences           | Project leave records, filtered and paginated        |
| `/config`                     | Configuration      | Save Jira instance, username, and API token locally  |

### Log Work — Bulk Date Range Submission

Selected dates are grouped into contiguous ranges before submission. One API request covers the
entire range (`startDate ≠ endDate`), reducing calls from N per entry to 1 per contiguous block.

**Grouping rule**: two dates are contiguous only if they are exactly 1 calendar day apart. This
prevents ranges from spanning weekends or holidays — the backend rejects an entire range if any date
within it is a holiday.

Key utilities in `src/lib/timesheet.ts`:

```typescript
// Group sorted Jira-format dates into contiguous ranges
groupDatesIntoRanges(dates: string[]): DateRange[]

// Format range for display: "4/May/26 → 8/May/26" or "4/May/26"
formatRangeLabel(range: DateRange): string
```

### Key Types (`src/types/timesheet.ts`)

```typescript
interface DateRange {
  startDate: string; // Jira D/Mon/YY format
  endDate: string;
  dates: string[]; // individual dates in the range
}

interface RequestStatus {
  entryId: string;
  issueKey: string;
  rangeLabel: string; // "4/May/26 → 8/May/26"
  dates: string[]; // individual dates for display
  status: 'pending' | 'in-progress' | 'success' | 'failed' | 'skipped';
  error?: string;
}

interface LogWorkResult {
  entry: WorkEntry;
  success: boolean;
  error?: string;
  failedRanges?: DateRange[];
}
```

### Key Hooks

| Hook                   | File                               | Purpose                                             |
| ---------------------- | ---------------------------------- | --------------------------------------------------- |
| `useLogWorkSubmission` | `hooks/use-log-work-submission.ts` | Submit entries by range, track status, retry failed |
| `useMissingWorklogs`   | `hooks/use-missing-worklogs.ts`    | Find dates with missing worklogs for a project      |
| `useTimesheetSettings` | `hooks/use-timesheet-settings.ts`  | Load/save Jira credentials from localStorage        |

### API Routes (`src/app/api/jira/`)

All routes proxy to `API_BASE_URL`, forwarding the caller's `Authorization: Bearer <PAT>` header.

| Route                                         | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `POST /api/jira/worklogs/logwork`             | Proxy to backend; forwards worklog with date range   |
| `GET  /api/jira/worklogs`                     | List the current user's worklogs                     |
| `GET  /api/jira/project-worklogs`             | List worklogs for a project                          |
| `POST /api/jira/project-worklogs/warning`     | Caller's own missing worklog dates for a project     |
| `POST /api/jira/project-worklogs/warning/all` | Missing worklog dates for every user on a project    |
| `GET  /api/jira/projects`                     | List Jira projects                                   |
| `GET  /api/jira/issues/search`                | Search issues for a project                          |
| `GET  /api/jira/absences`                     | One page of project leave records (rows + page info) |
| `GET  /api/jira/users/picker`                 | Search users by name/username for the user selector  |
| `GET  /api/jira/auth/check`                   | Validate the stored Jira token                       |
| `/api/jira/autolog/*`                         | CRUD + run for autolog configurations                |

### Logwork API Payload

```json
{
  "jiraInstance": "jiradc",
  "worklog": {
    "username": "BaoHQ11",
    "issueKey": "PROJECT-48",
    "timeSpend": 28800,
    "startDate": "4/May/26",
    "endDate": "8/May/26",
    "typeOfWork": "Review",
    "description": "Code Review",
    "time": " 09:00:00",
    "remainingTime": 0,
    "period": false
  }
}
```

When `startDate === endDate`, logs for a single day. When they differ, the backend logs for every
calendar day in the range.

## Site Announcement Banner (all apps)

Site-wide announcement/maintenance banners shared by every app (`web`, `admin`, `insight`, `pulse`).
Staff edit them from **`apps/admin` at `/site-banner`** — a form with a live preview, per-app
targeting, an optional schedule window, presets, and a change log. Saving takes effect within
seconds; no deploy, no dashboard, no hand-written JSON.

**An app can show several banners at once**: every announcement targeted at all apps, plus every one
targeted at that app. They stack most urgent first.

### Storage: Vercel Global Config

The announcement lives in a Vercel **Global Config** store (formerly Edge Config), read with
`@vercel/global-config` and written by admin through the Vercel REST API. It is not a feature flag:
no Flags SDK, no adapter, no flag declaration — just plain JSON in two items.

**One item per config feature, named after the feature.** Values are real objects, not JSON strings,
and a target with no announcement is simply absent — "off" and "absent" are the same state.

```jsonc
// Global Config item "site-banner"
{
  "all": null,                 // global fallback; absent or null = off
  "pulse": { "state": "warning", "message": "…" }
}

// Global Config item "config-audit" — last 20 changes across every config
// feature, newest first, each tagged with `feature`. Named `config-audit`, not
// `audit`: apps/admin already has an unrelated audit feature backed by the API.
[{ "at": "…", "by": "…", "feature": "site-banner", "target": "pulse",
   "action": "save", "summary": "…" }]
```

The two lists add up rather than one replacing the other. A second config feature gets its own
top-level item (`"maintenance"`, `"rate-limits"`) plus its own `feature` tag in `config-audit` — no
migration, and no cross-feature write contention, since a save merges only its own item.

### Stacking order

`sortAnnouncements()` orders every banner an app shows: **most urgent first** (`error` → `warning` →
`success`/`info`, which share a tier), then **most recently saved** within a tier. Nothing for staff
to manage, and a feature announcement can never bury an outage notice. An entry with no `savedAt`
sorts last in its tier.

There are no Vercel Flags left in this repo — no Flags SDK, no adapter, no `FLAGS` env var. Tool
visibility, the last thing modelled as one, is now its own Global Config item (see **Tool
Visibility** below).

### Shared pieces (`@workspace/ui`)

| File                                        | Exports                                               |
| ------------------------------------------- | ----------------------------------------------------- |
| `lib/site-announcement.ts`                  | `SiteAnnouncement`, `announcementSchema`,             |
|                                             | `parseAnnouncement()`, `resolveScheduled()`,          |
|                                             | `isAnnouncementActive()`, `SITE_BANNER_APPS`,         |
|                                             | `SITE_BANNER_ITEM_KEY`, `SiteBannerConfig`            |
| `lib/site-announcement-server.ts`           | `getSiteAnnouncement(app)` — the Global Config read   |
| `components/site-announcement-provider.tsx` | `SiteAnnouncementProvider`, `useSiteAnnouncement()`   |
| `components/site-banner.tsx`                | `SiteBanner` — renders `Banner` from the announcement |

One zod schema (`announcementSchema`) validates every entry everywhere: on read in
`getSiteAnnouncements`, on write in the admin API route, and per-entry in the editor's snapshot
read. One malformed entry is dropped without taking the rest of the list with it. `SiteBanner` does
no parsing or sorting — what reaches the client is already validated and ordered, so zod stays out
of the reader apps' client bundles.

`SiteBanner` takes the list from `useSiteAnnouncements()`, so apps just render it; pass
`announcements` to drive it from another source (the admin preview does this). Banners are not
dismissible — they stay visible until cleared or updated. (`Banner` still supports `onDismiss` for
other, non-site-wide uses.)

### Announcement value

```json
{
  "id": "9f1c…",
  "savedAt": "2026-09-04T09:12:00.000Z",
  "state": "warning",
  "title": "Scheduled maintenance",
  "message": "Jira sync is paused Sat 2-4am UTC.",
  "actionLabel": "Status page",
  "actionHref": "https://status.elevensys.dev",
  "startsAt": "2026-09-05T02:00:00.000Z",
  "endsAt": "2026-09-05T04:00:00.000Z"
}
```

- `id` addresses one announcement in a target's list; `savedAt` breaks ties in stacking order. Both
  are stamped server-side on every write and are never taken from the client. Both are optional on
  read: a hand-written entry without them still renders.
- `state`: `info` | `success` | `warning` | `error` (an unrecognized value falls back to `info`)
- `message` is required; a missing or blank message hides the banner
- `actionLabel`/`actionHref` are only used as a pair — an unmatched half is dropped
- `startsAt`/`endsAt` are optional ISO instants; outside the window the banner is hidden, and an
  unparseable bound is ignored rather than hiding the banner

A value the schema rejects logs to `console.error` and is dropped from the stack rather than
breaking the page or hiding the other banners.

### Wiring in an app

1. Read them in the root layout and hand them to the provider:

   ```tsx
   const announcements = await getSiteAnnouncements('pulse');
   // …
   <SiteAnnouncementProvider announcements={announcements}>
   ```

2. Render `<SiteBanner />` in `main-layout.tsx` just below the sticky header

`getSiteAnnouncements()` does the whole job: `all` plus the app's own list, schedule window applied,
sorted. Add the app to `SITE_BANNER_APPS` so admin can target it.

Each `MainLayout` accepts a `banner` prop: omit it for the Global Config value, or pass `null` to
suppress it on a given page.

> `apps/web` also wraps `VisibleToolsProvider` for tool visibility. The other three apps have
> neither — only the announcement provider.

> The schedule window is applied **server-side while the layout renders**, not inside the client
> `SiteBanner`. Evaluating it during render on both server and client risks a hydration mismatch
> when a bound falls between the two. The trade-off: an already-open page picks up a scheduled start
> on its next navigation or reload, not on a timer.

> A missing store is not an error: `getSiteAnnouncements()` returns `[]` when neither
> `GLOBAL_CONFIG` nor `EDGE_CONFIG` is set (the SDK throws on an undefined connection string) and
> also when the read itself fails, so an app without a store — or an unreachable Global Config —
> still renders, with no banners shown.

### Editing it (apps/admin)

| File                           | Role                                       |
| ------------------------------ | ------------------------------------------ |
| `app/site-banner/page.tsx`     | Staff-gated page; reads the current values |
| `app/site-banner/_components/` | Form (with live preview) and change log    |
| `app/api/site-banner/route.ts` | `GET` snapshot, `POST` save                |
| `lib/global-config-admin.ts`   | Vercel REST reads/writes (`server-only`)   |
| `lib/site-banner-schema.ts`    | Form schema, presets, form↔announcement    |

Access is already handled by `proxy.ts`, which gates every non-public path on
`COGNITO_REQUIRED_GROUP` (default `staff`).

The editor shows one target's banners as a list; picking one opens it in the form, **Add banner**
starts a fresh draft, and each save writes exactly one announcement addressed by `id` — an existing
id is replaced in place, a new one is appended, and a `null` announcement removes it. Saving one
banner never disturbs the others on that target.

Unlike the apps' read, the editor keeps scheduled announcements that are not showing yet — staff
need to see and edit them before they go live.

Reads go through the Vercel REST API rather than the Global Config SDK: the API is consistent with
writes, so the editor shows what was just saved instead of waiting out replication. Writes are
read-merge-write with no locking — last write wins, which the change log makes visible.

> **Do not call `form.reset(values)` in these forms.** `useForm` re-applies its options on every
> render, overwriting the `defaultValues` that `reset` sets, so the passed values are silently
> discarded. Load values with `form.setFieldValue(..., { dontUpdateMeta: true })` instead — see
> `applyValues` in `site-banner-form.tsx`. Argument-less `form.reset()` is fine.

> **Keep whatever builds `defaultValues` pure.** Same cause: it is re-evaluated every render, so a
> value that differs between calls — a `crypto.randomUUID()`, a `new Date()` — updates the store,
> which re-renders, which generates another one: "Maximum update depth exceeded". `toFormValues`
> therefore leaves a new draft's `id` empty and the id is assigned on submit. A test in
> `site-banner-form.test.tsx` re-renders 30 times to catch a regression.

## Tool Visibility (apps/web)

Which of the nine tools appear in `apps/web`. Staff edit it from **`apps/admin` at
`/tools-visibility`** — a checkbox per tool. Like the site banner, it lives in Global Config and
takes effect within seconds, with no deploy.

This used to be the `sidebar-tools` Vercel Flag. It was never really a feature flag, and it was the
last one — removing it took the Flags SDK, `FLAGS`/`FLAGS_SECRET`, and the Flags Explorer route with
it.

```jsonc
// Global Config item "sidebar-tools"
["/tools/passly", "/tools/urlify"]

// absent → every tool is visible, including tools added later
// []     → no tools
```

**Absent is not the same as listing every tool.** Both show all nine today, but the moment a tenth
ships, an explicit list hides it while an absent item shows it. The editor's "show every tool,
including ones added later" switch chooses between them: on, the save deletes the item.

**Every failure shows all tools.** A missing store, an unreachable Global Config, or a malformed
value all resolve to `null`. Hiding the whole toolset over a config read would be the worse failure,
so `getVisibleToolPaths()` fails open.

### The pieces

| File                                              | Role                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/ui/src/lib/tools.ts`                    | `TOOLS` catalogue, `parseVisibleToolPaths()`, `SIDEBAR_TOOLS_ITEM_KEY` |
| `apps/web/src/lib/sidebar-tools-server.ts`        | `getVisibleToolPaths()` — the Global Config read                       |
| `apps/web/src/contexts/visible-tools-context.tsx` | `VisibleToolsProvider`, `useVisibleTools()`                            |
| `apps/web/src/app/tools/layout.tsx`               | 404s a tool page that is not on the allowlist                          |
| `apps/admin/src/app/tools-visibility/`            | The editor page and form                                               |
| `apps/admin/src/lib/tools-visibility-admin.ts`    | Read/write the item                                                    |

`TOOLS` is shared because both apps need the same list: web renders it in the sidebar (adding its
own icons and `isPro` flags in `app-sidebar-config.ts`), and the admin editor renders one checkbox
per entry. **Add a new tool to `packages/ui/src/lib/tools.ts` and give it an icon in `TOOL_ICONS`**
— the sidebar and the editor both pick it up.

A stored path no longer in `TOOLS` matches nothing and is dropped on the next save, so retiring a
tool needs no migration.

## Shared Global Config plumbing (apps/admin)

Two features now write to the same store, so the Vercel REST machinery lives in
`apps/admin/src/lib/global-config-client.ts` (`server-only`): `vercelApi()`, `readItems()`,
`readAudit()`, `writeConfigItem()`, `isGlobalConfigConfigured()`, `GlobalConfigError`. Each feature
keeps its own read/write on top (`global-config-admin.ts`, `tools-visibility-admin.ts`).

`writeConfigItem()` writes **one feature's item plus the shared `config-audit` log** in a single
PATCH, so one feature's save can never disturb another's config. Passing `undefined` as the value
deletes the item. Both `*-admin.test.ts` files pin that isolation.

`config-audit` entries carry `feature` (and an optional `target`), and `ChangeLog`
(`src/components/features/change-log.tsx`) renders whichever slice an editor asks for.

> `HISTORY_LIMIT` and `ConfigAuditEntry` live in `src/types/config-audit.ts`, not in
> `global-config-client.ts` — `ChangeLog` reaches the client bundle, and importing anything from a
> `server-only` module there fails the build.

## Performance Considerations

- **Turbopack**: Enabled for faster dev/build (Next.js 16 feature)
- **Server Components**: Root layout fetches auth server-side
- **Image Optimization**: Use `next/image` for images
- **Font Optimization**: `next/font` with Ubuntu + Ubuntu Mono across all apps
- **Code Splitting**: Tool pages are naturally code-split by route
- **Workspace caching**: Turborepo caches build outputs across apps

## Related Documentation

- `.github/repo-instructions.md` - Detailed development guidelines
- `.github/copilot-instructions.md` - Copilot-specific guidelines
- `.github/nextjs-instructions.md` - Extended Next.js patterns

## Code Review Sub-Agent Routing

**Parallel dispatch** (all conditions met):

- Reviewing independent modules/files with no shared state
- Tasks are read-only (no file modification risk)

**Sequential dispatch** (any condition triggers):

- One review feeds the next (readability → then optimize refactored code)
- Shared files between agents

**Agent Selection**:

- "review", "readability", "naming" → code-reviewer
- "optimize", "slow", "performance", "render" → performance-optimizer
- "security", "best practice", "hardening", "AWS" → best-practices-enforcer

<!-- VERCEL BEST PRACTICES START -->

## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to
Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use
  Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres
  instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline
  parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g.
  'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK needed. Always curl
  https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel
MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
