# Next.js Claude Code Subagents

A set of 4 specialized Claude Code subagents for reviewing and improving Next.js projects.

## Subagents

| Agent                   | Trigger phrases                                                   | Model  |
| ----------------------- | ----------------------------------------------------------------- | ------ |
| `nextjs-reviewer`       | "review my project", "full audit", "comprehensive analysis"       | Sonnet |
| `nextjs-readability`    | "readability", "naming", "clean code", "refactor for clarity"     | Sonnet |
| `nextjs-performance`    | "performance", "slow", "bundle size", "Core Web Vitals"           | Sonnet |
| `nextjs-best-practices` | "best practices", "security", "a11y", "error handling", "testing" | Sonnet |

## Installation

### Option A — Project-level (recommended, versioned with your repo)

```bash
mkdir -p .claude/agents
cp .claude/agents/*.md .claude/agents/
```

### Option B — Global (available across all your projects)

```bash
mkdir -p ~/.claude/agents
cp .claude/agents/*.md ~/.claude/agents/
```

## Usage Examples

```
# Full project audit (runs all 3 reviewers in parallel)
Review my entire Next.js project

# Focused reviews
Check the readability of my components
Audit my project for performance issues
Run a best practices check on my codebase

# Targeted
Use the nextjs-performance agent to check my app/dashboard/page.tsx
```

## Agent Architecture

```
nextjs-reviewer (orchestrator)
├── nextjs-readability   → naming, types, component structure, comments
├── nextjs-performance   → rendering, bundle, images, re-renders, data fetching
└── nextjs-best-practices → security, a11y, error handling, testing, config
```

The `nextjs-reviewer` orchestrator runs all three in parallel and produces a unified, prioritized
report with a sprint-based fix sequence.

## Scope per Agent

| What                                | readability | performance | best-practices |
| ----------------------------------- | :---------: | :---------: | :------------: |
| Naming conventions                  |     ✅      |             |                |
| TypeScript types                    |     ✅      |             |                |
| Component decomposition             |     ✅      |             |                |
| JSDoc / comments                    |     ✅      |             |                |
| Rendering strategy (SSR/SSG/ISR)    |             |     ✅      |                |
| Bundle size & dynamic imports       |             |     ✅      |                |
| Image & font optimization           |             |     ✅      |                |
| React re-renders (memo, useMemo)    |             |     ✅      |                |
| Data fetching patterns              |             |     ✅      |                |
| Security (env vars, XSS, injection) |             |             |       ✅       |
| Error boundaries & handling         |             |             |       ✅       |
| Accessibility (a11y)                |             |             |       ✅       |
| Auth & authorization                |             |             |       ✅       |
| Testing coverage                    |             |             |       ✅       |
| ESLint / tsconfig config            |             |             |       ✅       |
| SEO & metadata                      |             |             |       ✅       |
