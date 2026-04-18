# User Story Readiness Assessment Request

## Objective
Generate a comprehensive readiness report for the user stories/defects shown in the attached image, saved as a markdown file. The focus is on determining if these stories are ready to be worked on based on the status of their dependencies.

## Data Sources & Tools
- Use Rally MCP tools to retrieve user story details, statuses, and metadata
- Use GitHub/GHE MCP tools to search for related pull requests and branches of dependency stories
- Cross-reference information from both systems for accuracy

## Target User Stories/Defects
**Extract the list of user story IDs and defect IDs from the attached image.** Parse all visible entries including:
- User Story IDs (format: US#######)
- Defect IDs (format: DE#######)
- Their corresponding names/descriptions

## Analysis Requirements

### 1. Rally Data Collection
For each target user story/defect:
- Current status in Rally
- Parent feature information (ID, name, status, description)
- Acceptance criteria and definition of done
- Story points and iteration assignment
- Any explicitly documented dependencies or blockers

For each parent feature:
- Retrieve ALL child user stories and defects under the same feature
- Identify the relationships and logical order of stories
- Note any feature-level dependencies or blockers

### 2. Dependency Identification
For each target user story/defect, determine logical dependencies by analyzing:

**Common dependency patterns:**
- **Tagging/Analytics stories**: Depend on corresponding UI implementation stories
- **Feature flag cleanup stories**: Depend on feature implementation and rollout completion
- **UI implementation stories**: May depend on API, backend service, or data model stories
- **API/Service stories**: May depend on infrastructure, database, or authentication stories
- **Integration stories**: Depend on both systems being implemented
- **Testing/QA stories**: Depend on implementation stories being complete
- **Refactor stories**: May depend on test coverage or related feature completion

**Identification strategy:**
- Examine story titles and descriptions for keywords (e.g., "tagging", "cleanup", "refactor")
- Review acceptance criteria for references to other functionality
- Check parent feature to understand the logical implementation sequence
- Look for explicit dependency links in Rally
- Consider technical architecture requirements

### 3. GitHub/GHE Verification of Dependencies
**Critical focus**: For each identified dependency story (NOT the target stories):

**Search strategy:**
- Search for branches containing the dependency user story/defect ID
- Search for pull requests that reference the dependency user story/defect ID in:
  - PR title
  - PR description
  - Commit messages
  - Comments

**PR assessment criteria:**
- **Merged status**: Check if PR is merged to main/master branch
- **Approval status**: Check if PR has required approvals
- **CI/CD status**: Check if automated tests are passing
- **Review comments**: Identify any unresolved blocking comments
- **Merge conflicts**: Check for conflicts with target branch
- **Draft status**: Determine if PR is still in draft/WIP state
- **Age and activity**: Note last update date and recent activity

### 4. Readiness Assessment Criteria

Classify each target user story/defect into one of these categories:

**✅ Fully Ready**
- All critical dependency stories are merged to main branch
- Dependencies are deployed to relevant environments (if applicable)
- No blockers or prerequisites remain

**⚠️ Ready with Prerequisites**
- Dependency PRs exist and are in good state (approved, tests passing, no conflicts)
- Team can checkout dependency PR branches for early investigation
- Minimal risk to start work while waiting for dependency merge
- Document which PR branches need to be checked out

**🔴 Blocked**
- Critical dependency stories have no PR or branch
- Dependency PRs are in draft with significant unresolved issues
- Dependency PRs have failing tests or blocking review comments
- Dependency PRs have major merge conflicts
- Technical or architectural decisions pending

**❓ Needs Investigation**
- Unclear dependencies or incomplete Rally information
- Conflicting information between Rally and GitHub
- Dependencies exist but their status is ambiguous

### 5. Cross-System Validation
- Compare Rally status with actual GitHub PR status for dependency stories
- Flag discrepancies (e.g., Rally shows "Completed" but no merged PR exists)
- Note when GitHub shows progress that Rally doesn't reflect
- Identify dependency stories that are technically ready but administratively incomplete

## Output Format

Create a markdown file named `readiness-report-YYYY-MM-DD.md` with the following structure:

### 1. Executive Summary
```
Assessment Date: [Date]
Total Stories/Defects Assessed: X

Readiness Breakdown:
- ✅ Fully Ready: X (X%)
- ⚠️ Ready with Prerequisites: X (X%)
- 🔴 Blocked: X (X%)
- ❓ Needs Investigation: X (X%)

Overall Readiness Score: X%
```

### 2. Detailed Assessment Table
| Target Item | Name | Rally Status | Dependencies | Dependency PR Status | Readiness | Action Required |
|-------------|------|--------------|--------------|---------------------|-----------|-----------------|
| US-XXXXX | ... | ... | US-YYYYY | Merged ✓ | ✅ Ready | None |
| US-XXXXX | ... | ... | US-YYYYY | PR #123 (Approved) | ⚠️ Ready | Checkout PR #123 |
| DE-XXXXX | ... | ... | US-YYYYY | No PR found | 🔴 Blocked | Wait for US-YYYYY |

### 3. Feature-Grouped Analysis
For each parent feature:
```markdown
## Feature: [Feature Name] (Feature-ID)
**Status**: [Status]

### User Stories/Defects in this Feature:
- US-XXXXX: [Name] - [Status]
- US-YYYYY: [Name] - [Status] (Dependency of US-XXXXX)
- DE-ZZZZZ: [Name] - [Status]

### Dependency Flow:
US-YYYYY (Backend) → US-XXXXX (UI) → DE-ZZZZZ (Bug Fix)

### Readiness Summary:
- [Assessment of feature-level readiness]
```

### 4. Actionable Recommendations

**Ready to Start Immediately:**
- [List stories/defects with merged dependencies]

**Ready for Early Investigation:**
- [List stories/defects with stable dependency PRs]
- Provide specific PR branches to checkout:
  - `US-XXXXX: checkout branch feature/us-yyyyy from PR #123`

**Blocked - Action Needed:**
- [List blocked stories/defects with specific blockers]
- Identify who/what is blocking each item

**Needs Clarification:**
- [List stories/defects needing more information]
- Specific questions to resolve

### 5. Risk Assessment
- Highlight any critical path blockers
- Note dependencies with stale or inactive PRs
- Flag discrepancies between Rally and GitHub that need resolution
- Identify stories where "ready with prerequisites" might carry risk

### 6. Appendix: Dependency Details
For each dependency story/defect analyzed:
```markdown
#### US-YYYYY: [Dependency Story Name]
- **Rally Status**: [Status]
- **GitHub Branch**: [branch-name]
- **PR**: #[number] - [PR title]
- **PR Status**: [Open/Merged/Closed]
- **Approvals**: X/Y required
- **Tests**: [Passing/Failing]
- **Last Updated**: [Date]
- **Notes**: [Any relevant observations]
```

## Important Guidelines

1. **First, extract all user story/defect IDs from the attached image** before beginning analysis
2. **Prioritize GitHub data over Rally status** when assessing actual code readiness
3. **Document assumptions** when dependency relationships are inferred rather than explicit
4. **Consider "ready with prerequisites"** a valid state - teams can often begin investigation with stable dependency PRs
5. **Be specific** about what needs to happen for blocked items to become unblocked
6. **Flag discrepancies** between systems prominently so they can be corrected
7. **Include timestamps** to show when the assessment was performed
8. **Provide actionable next steps** rather than just status reporting
9. **Handle both user stories and defects** - defects may have different dependency patterns

## Execution Steps

1. Parse the attached image to extract all user story IDs (US#######) and defect IDs (DE#######)
2. For each extracted ID, gather Rally data
3. Identify parent features and sibling stories/defects
4. Determine logical dependencies for each target item
5. Search GitHub/GHE for PRs related to dependency items
6. Assess readiness based on dependency PR status
7. Generate the comprehensive markdown report
8. Save the report with filename format: `readiness-report-YYYY-MM-DD.md`