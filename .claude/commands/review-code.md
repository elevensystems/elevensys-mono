---
description:
  Run a full Next.js code review using all three specialist subagents (readability, performance,
  best practices) in parallel. Accepts an optional file or directory path; defaults to the entire
  project.
argument-hint: '[path/to/file-or-directory] (optional — defaults to full project)'
---

# Next.js Code Review

## Input Resolution

<$ARGUMENTS> contains the target passed by the user (e.g. `app/dashboard/page.tsx`, `components/`,
or empty for full project).

Resolve the review target:

- If `<$ARGUMENTS>` is empty → review the entire project (all source directories)
- If it points to a single file → review that file only
- If it points to a directory → review all files inside it recursively

State clearly at the top of your response:

```
🎯 Review target: <resolved path or "full project">
```

---

## Phase 1 — Quick Project Scan

Before delegating, read these files to build context (skip if they don't exist):

1. `package.json` → Next.js version, key dependencies
2. `next.config.*` → configuration flags
3. `tsconfig.json` → strict mode, paths
4. Top-level structure of `app/` or `pages/`

Produce a one-paragraph **Project Snapshot** summarizing what you found.

---

## Phase 2 — Parallel Agent Delegation

Invoke all three subagents **simultaneously** on the resolved target:

### 🔤 Subagent 1 — `nextjs-readability`

Prompt:

> "Review **<resolved target>** for readability issues. Check: naming conventions (variables,
> booleans, handlers, hooks), TypeScript type clarity (any, missing types, discriminated unions),
> component decomposition (>100 line components, mixed concerns), JSDoc coverage on exports, magic
> values, and complex conditional rendering. For each issue show the current code and an improved
> version."

### ⚡ Subagent 2 — `nextjs-performance`

Prompt:

> "Audit **<resolved target>** for performance issues. Check: unnecessary 'use client' directives,
> missing fetch cache strategies, large un-split client bundles (no next/dynamic), <img> instead of
> next/image, missing priority on above-fold images, fonts not using next/font, missing
> useMemo/useCallback/React.memo, sequential awaits that should be Promise.all, and next.config
> optimizations."

### ✅ Subagent 3 — `nextjs-best-practices`

Prompt:

> "Audit **<resolved target>** for best practice violations. Check: NEXT*PUBLIC* secret exposure,
> unvalidated Server Action inputs (missing Zod/Valibot), dangerouslySetInnerHTML without
> sanitization, missing error.tsx boundaries, API routes returning wrong status codes, missing
> aria-label/alt text, form inputs without labels, heading hierarchy violations, unprotected routes,
> and hardcoded secrets."

---

## Phase 3 — Synthesized Report

Once all three subagents respond, compile results into this structure:

---

### 📋 Project Snapshot

[From Phase 1]

---

### 🔴 Critical — Fix Immediately

Security vulnerabilities, exposed secrets, data integrity risks.

| #   | File        | Issue       | Fix    |
| --- | ----------- | ----------- | ------ |
| 1   | `path:line` | description | action |

---

### 🟠 High Priority — This Sprint

Broken error handling, Core Web Vitals killers, major a11y failures, large unoptimized bundles.

| #   | File | Category | Issue | Fix |
| --- | ---- | -------- | ----- | --- |

---

### 🟡 Medium Priority — Next Sprint

High-impact readability improvements, moderate performance wins, structural issues.

| #   | File | Category | Issue | Fix |
| --- | ---- | -------- | ----- | --- |

---

### 🟢 Low Priority — Backlog

Config improvements, minor readability, test coverage additions.

| #   | File | Category | Issue | Fix |
| --- | ---- | -------- | ----- | --- |

---

### 📊 Scorecard

| Dimension         | Score     | Biggest Issue |
| ----------------- | --------- | ------------- |
| 🔤 Readability    | `/10`     |               |
| ⚡ Performance    | `/10`     |               |
| ✅ Best Practices | `/10`     |               |
| **Overall**       | **`/10`** |               |

**Scoring**: 9–10 Excellent · 7–8 Good · 5–6 Needs Work · 3–4 Poor · 1–2 Critical

---

### 🗺 Recommended Fix Order

**Today (Critical)**

- [ ] task
- [ ] task

**This Week (High Priority)**

- [ ] task
- [ ] task

**Next Sprint (Medium)**

- [ ] task

**Backlog (Low)**

- [ ] task

---

### 💡 Cross-Cutting Observations

Note any patterns that appear across multiple dimensions (e.g. "Missing error.tsx affects both Best
Practices and Core Web Vitals"). Max 5 bullet points.

---

## Usage Examples

```bash
# Full project review
/review-code

# Single file
/review-code app/dashboard/page.tsx

# Entire feature directory
/review-code app/dashboard/

# Shared components
/review-code components/

# Lib & utilities
/review-code lib/
```
