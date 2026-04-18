# AI Agent PR Review (Local Mode)

## Objective
Perform a comprehensive code review on a Pull Request using the AI Workflow Orchestrator pattern with MCP (Model Context Protocol) tools. This is a **local-only** review that outputs results directly in the chat without posting any comments or reviews to the PR.

## Instructions

### Step 1: Fetch the Latest Orchestrator Prompt
Use GitHub/GHE Related MCP tools to retrieve the current version of the AI Workflow Orchestrator from (do not fetch it directly):
```
https://ghe.coxautoinc.com/Consumer/ai-cop-patterns/raw/main/copilot-prompts/prompts/orchestrator/ai-workflow-orchestrator.prompt.md
```

**Fallback Mechanism:**
If the orchestrator content cannot be retrieved via MCP tools or direct fetch (due to network issues, authentication failures, or tool unavailability), use the local fallback file:
```
.vscode/orchestrator.md
```
The agent should:
1. First attempt to fetch the orchestrator from the remote URL using MCP tools
2. If MCP tools fail, attempt a direct web fetch
3. If both remote methods fail, read the local `orchestrator.md` file from the `.vscode` folder in the workspace root
4. If the local file also doesn't exist, proceed with a basic code review structure and note that the orchestrator template was unavailable

**Before proceeding to review, display in the chat which orchestrator source is being used:**
```markdown
## 🔄 Orchestrator Source
Using: [Remote orchestrator from GHE / Local orchestrator from .vscode/orchestrator.md / Basic code review structure]
Reason: [Successfully fetched from remote / Remote fetch failed, using local fallback / All sources unavailable, using basic structure]
```

### Step 2: Apply Orchestrator to PR Review
Using the retrieved orchestrator prompt (from remote fetch, local `.vscode/orchestrator.md` file, or basic code review structure), analyze the following Pull Request:

**PR URL:** `https://ghe.coxautoinc.com/Autotrader/find-car/pull/15050`

### Step 3: Fetch Rally Information
The AI agent **must** attempt to retrieve Rally artifact details using Rally MCP tools:

1. **Extract Rally ID**: Look for Rally artifact references (e.g., `US123456`, `DE123456`, `TA123456`) in the following locations:
   - PR title
   - PR description/body
   - Branch name (e.g., `feature/US123456-add-login` or `bugfix/DE789012`)
   - Linked issues or commits
2. **Query Rally**: Use Rally MCP tools (such as `fetchRallyStory`, `fetchRallyDefect`, or similar) to fetch the artifact details including:
   - **Story Points**: The estimated effort for the work item
   - **Name/Title**: The title of the story or defect
   - **Description**: The full description explaining the requirements, acceptance criteria, and expected behavior
   - **State**: Current state of the artifact (e.g., In-Progress, Completed)
   - **Owner**: Who is assigned to the work item
3. **Use Rally Context for Review**: The AI agent should use the Rally description and acceptance criteria to:
   - Verify the PR implementation aligns with the requirements
   - Check if all acceptance criteria are addressed in the code changes
   - Identify any gaps between the requirements and the implementation
   - Flag if the PR appears to be missing functionality described in the story/defect
4. **Fallback**: If no Rally ID is found or the Rally query fails, set Story Points to "N/A" and note that Rally context was unavailable for requirement validation.

## Output Action

### Step 4: Display Review Results Locally
⚠️ **LOCAL MODE: Do NOT post any comments, reviews, or approvals to the PR.**

Instead, output the complete review directly in the chat response, including:

1. **Review Summary**: Overall assessment of the PR
2. **Detailed Findings**: List all issues found, categorized by severity and type
3. **Code Suggestions**: Specific recommendations for improvements
4. **Security Considerations**: Any security-related observations
5. **Performance Considerations**: Any performance-related observations

### Step 5: Display Metrics Summary Locally
Output the following metrics summary in the chat response:

```markdown
## 📊 PR Review Metrics

| Metric | Value |
|--------|-------|
| Lines of Code Changed | [number] |
| Total Issues Found | [number] |
| Critical Issues | [number] |
| Medium Issues | [number] |
| Low Issues | [number] |
| Security Issues | [number] |
| Performance Issues | [number] |
| Logic Issues | [number] |
| Style Issues | [number] |
| Documentation Issues | [number] |
| Test Coverage Issues | [number] |
| Risk Level | [Low/Medium/High/Critical] |
| Story Points | [number or N/A if no Rally info] |
| Total Review Rounds | [number] |
```

**Notes:**
- All metrics above are calculated automatically by the AI agent during the review process.
- **Story Points** must be fetched from Rally using Rally MCP tools. The agent should search for Rally artifact IDs (US, DE, TA, TC prefixes) in the PR and query Rally accordingly.
- **Total Review Rounds** is determined by counting the review iterations from the PR history.

---

## ⚠️ Important: Local Mode Restrictions

This prompt is configured for **local review only**. The AI agent **must NOT**:
- ❌ Post comments on the PR
- ❌ Approve the PR
- ❌ Request changes on the PR
- ❌ Create or modify any PR reviews
- ❌ Use any MCP tools that write to or modify the PR

The agent **should only**:
- ✅ Read PR information (title, description, diff, commits, etc.)
- ✅ Read Rally information for Story Points
- ✅ Analyze the code changes
- ✅ Output all findings directly in the chat response
