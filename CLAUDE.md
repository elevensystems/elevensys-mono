# CLAUDE.md - AI Assistant Guide for Elevensys Mono

This document provides comprehensive guidance for AI assistants working with the Elevensys Mono
codebase.

## Project Overview

**Elevensys Mono** is a Turborepo monorepo containing multiple Next.js applications and shared
packages. It provides AI-powered productivity tools and an admin dashboard. Built with Next.js 16
(App Router), React 19, and TypeScript 5, using pnpm workspaces for dependency management.

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
| Language        | TypeScript 5 (strict mode)         |
| Styling         | Tailwind CSS v4                    |
| Components      | shadcn/ui + Radix UI primitives    |
| Icons           | lucide-react                       |
| Editor          | Monaco Editor                      |
| Auth            | AWS Cognito OAuth2 (PKCE)          |
| Theming         | next-themes                        |
| Notifications   | sonner                             |
| Forms           | @tanstack/react-form               |
| Package Manager | pnpm 10                            |

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
│   │   │   │   └── flags-context.tsx   # Feature flags
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

// Always use 'use client' directive for client components

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
- **Feature flags**: `FlagsProvider` wrapping `@flags-sdk/vercel`
- **Providers chain**: `ThemeProvider` → `AuthProvider` → `FlagsProvider`
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
- **Providers**: `ThemeProvider` → `FlagsProvider` — no Cognito
- **Auth**: Jira PAT saved in `localStorage` via `/config`, sent as a `Bearer` header to
  `/api/jira/*` proxy routes (forwarded to `API_BASE_URL`)
- **Env**: `API_BASE_URL` (validated in `src/env.ts`); optional `FLAGS` for the site banner
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

# Vercel Flags (all apps) — injected by the Vercel Flags integration.
# Optional: when unset, every flag falls back to its default value.
FLAGS=
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

A site-wide announcement/maintenance banner, driven by the `site-banner` feature flag and shared by
every app (`web`, `admin`, `insight`, `pulse`). Editing the flag is all it takes to show or hide it
— no deploy required.

### Shared pieces (`@workspace/ui`)

| File                            | Exports                                          |
| ------------------------------- | ------------------------------------------------ |
| `lib/site-announcement.ts`      | `SiteAnnouncement`, `parseAnnouncementBanner()`  |
| `components/flags-provider.tsx` | `FlagsProvider`, `useFlags()`, `FlagsRecord`     |
| `components/site-banner.tsx`    | `SiteBanner` — parses the flag, renders `Banner` |

`SiteBanner` reads the flag from `useFlags()`, so apps just render it. Dismissal is stored in
`localStorage` keyed by the announcement's own content, so editing the flag re-surfaces the banner
for users who dismissed the previous message.

### Flag value

Set the `site-banner` flag to a JSON object; an empty string hides the banner.

```json
{
  "state": "warning",
  "title": "Scheduled maintenance",
  "message": "Jira sync is paused Sat 2-4am UTC.",
  "actionLabel": "Status page",
  "actionHref": "https://status.elevensys.dev"
}
```

- `state`: `info` | `success` | `warning` | `error` (defaults to `info`)
- `message` is required; a missing or blank message hides the banner
- `actionLabel`/`actionHref` are only used as a pair

Malformed JSON logs to `console.error` and hides the banner rather than breaking the page.

### Wiring in an app

1. Declare the flag in `src/flags.ts` (see any app for the pattern)
2. Resolve it in the root layout and pass it down:
   `<FlagsProvider flags={{ 'site-banner': String((await siteBannerFlag()) ?? '') }}>`
3. Render `<SiteBanner />` in `main-layout.tsx` just below the sticky header

Each `MainLayout` accepts a `banner` prop: omit it for the flag-driven banner, or pass `null` to
suppress it on a given page.

> `vercelAdapter()` throws at module-evaluation time when `FLAGS` is unset, which would fail the
> build. Each `src/flags.ts` therefore attaches the adapter only when `process.env.FLAGS` is present
> and falls back to the flag's default value otherwise — so apps without the Vercel Flags
> integration provisioned still build, with the banner simply hidden.

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
