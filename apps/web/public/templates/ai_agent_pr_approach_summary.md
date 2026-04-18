# PR Approach Summary Generator

---
title: "PR Approach Summary Generator"
version: "1.0"
status: "stable"
dependencies: ["mcp-github", "rally-api"]
updated: "2025-12-11"
description: "Generates a concise PR Approach Summary by analyzing Rally requirements and code changes, then posts it to the PR description"
tags: ["pr", "documentation", "rally", "github", "summary"]
---

## Objective

Automatically generate a clear, concise **PR Approach Summary** that explains how the code changes address the Rally story/defect requirements. The summary will be posted to the PR description after user approval.

## Instructions

### Input Required
```
PR URL: <paste your PR URL here>
```

**Example:** `https://ghe.coxautoinc.com/Autotrader/find-car/pull/12345`

---

### Step 1: Extract PR Information

Use GitHub MCP tools to fetch PR details:

```
1. Parse the PR URL to extract: org, repo, pull_number
2. Fetch PR data using: mcp_cai-mcp_getGithubPullRequest(org, repo, pull_number)
3. Fetch PR files using: mcp_cai-mcp_getGithubPullRequestFiles(org, repo, pull_number)
4. Extract from PR response:
   - title
   - body (description)
   - head.ref (branch name)
   - additions, deletions, changed_files
```

---

### Step 2: Extract Rally IDs

Search for Rally artifact references in these locations (in order):
1. **PR Title** - Look for patterns like `US123456`, `DE123456`, `TA123456`, `TC123456`
2. **PR Description/Body** - Look for Rally links or ID references
3. **Branch Name** - Parse patterns like `feature/US123456-description` or `mi7_US123456_feature_name`
4. **Commit Messages** - If available, scan for Rally IDs

**Rally ID Patterns:**
- `US######+` - User Stories
- `DE######+` - Defects
- `TA######+` - Tasks
- `TC######+` - Test Cases
- `F######+` - Features

---

### Step 3: Fetch Rally Details

For each Rally ID found, use Rally MCP tools:

```
For User Stories: mcp_cai-mcp_listRallyStories with customQuery: (FormattedID = "US123456")
For Defects: mcp_cai-mcp_listRallyDefects with customQuery: (FormattedID = "DE123456")
```

**Extract from Rally response:**
- Name/Title
- Description
- Acceptance Criteria (parse from Description field)
- Story Points (PlanEstimate)
- State (ScheduleState)

---

### Step 4: Analyze Code Changes

Review the PR diff to understand:
1. **What files were changed** - Components, utilities, tests, configs
2. **What was added** - New functionality, new files
3. **What was removed** - Deleted code, removed features/flags
4. **What was modified** - Refactored logic, updated behavior

**Key questions to answer:**
- What is the core technical approach?
- Where does the main logic change happen?
- How does this solve the Rally requirements?
- What are the benefits of this approach?

---

### Step 5: Check for Existing Summary

Search the PR description body for an existing "PR Approach Summary" section:

```
Look for headers like:
- "## PR Approach Summary"
- "## Approach Summary"
- "### PR Approach"
```

**If existing summary found:**
1. Compare current diff against the summary content
2. Determine if summary is outdated (new commits, changed approach)
3. If outdated, generate updated summary
4. If current, inform user no update needed

**If no existing summary:**
1. Generate new summary

---

### Step 6: Generate PR Approach Summary

Create a summary following this structure:

```markdown
## PR Approach Summary

### Problem
[1-2 sentences describing the issue(s) being addressed, derived from Rally story/defect]

### Solution
[2-4 sentences explaining the technical approach taken to solve the problem]

### Key Changes
- [Bullet point 1: Major change category]
- [Bullet point 2: Major change category]
- [Bullet point 3: Major change category if applicable]

### Result
[1-2 sentences summarizing the outcome and benefits]
```

**Guidelines:**
- Keep total length under 200 words
- Use technical but accessible language
- Focus on the "why" and "how", not just the "what"
- Reference specific files/components when helpful
- Avoid implementation details that are obvious from the diff

---

### Step 7: Request User Approval

Before posting, display the generated summary and ask for approval:

```markdown
---

## 📝 Generated PR Approach Summary

[Display the generated summary here]

---

**📍 This summary will be added to the PR description.**

Would you like me to:
1. ✅ **Post this summary** to the PR description
2. ✏️ **Modify the summary** (provide your feedback)
3. ❌ **Cancel** - do not post

Please respond with your choice (1, 2, or 3).
```

---

### Step 8: Post to PR Description

**Only after user approval (choice 1):**

Use GitHub MCP tools to update the PR description. The summary should be:
- **Prepended** to the existing PR description (after any badges/links at the top)
- **Inserted after** any CI/CD badge links if present
- **Placed before** the Rally links section if it exists

**⚠️ Important:** 
- Do NOT overwrite existing PR content
- Preserve all existing description content
- Only add/update the "PR Approach Summary" section

---

## Output Format

The final PR description should look like:

```markdown
[Existing badges/links if any]

## PR Approach Summary

### Problem
[Generated problem statement]

### Solution
[Generated solution description]

### Key Changes
- [Change 1]
- [Change 2]

### Result
[Generated result statement]

---

[Rest of existing PR description - Rally links, Demo links, Checklist, etc.]
```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| No Rally ID found | Generate summary based on PR title and code changes only. Note that Rally context was unavailable. |
| Rally API fails | Proceed with code analysis only. Inform user Rally details couldn't be fetched. |
| PR fetch fails | Display error and ask user to verify PR URL and permissions. |
| Empty PR diff | Inform user no changes detected to summarize. |

---

## Example Usage

**User Input:**
```
PR URL: https://ghe.coxautoinc.com/Autotrader/find-car/pull/15149
```

**Generated Output:**
```markdown
## PR Approach Summary

### Problem
The Experian VHR logo and text link behaved inconsistently—clicking different UI elements led to different URLs. Additionally, the `vdp_enable_vhr_overview` feature flag reached 100% rollout and needed cleanup.

### Solution
Instead of fixing URL logic in multiple client components, the PR moves Experian URL transformation upstream to the `dispatchVehicleDetailsPageData` middleware. The renamed `getProcessedVHRTiles.js` utility now injects the listing ID into Experian URLs at data-load time, ensuring every UI entry point receives the same pre-processed URL.

### Key Changes
- Server-side URL processing in `getProcessedVHRTiles.js` middleware
- Complete removal of `vdp_enable_vhr_overview` feature flag and associated components
- Simplified `VhrLink.jsx` by removing client-side URL manipulation

### Result
Consistent navigation behavior across all VHR touchpoints and ~1,100 lines of dead code removed.
```

---

## Notes

- This prompt is designed for use with GitHub Enterprise and Rally integrations via MCP tools
- Always verify the generated summary accurately reflects the code changes before approving
- The summary should help reviewers quickly understand the PR's purpose and approach
