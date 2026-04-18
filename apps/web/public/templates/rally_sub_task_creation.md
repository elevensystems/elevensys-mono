# Rally Sub Task Generation

## Instructions
Use appropriate Rally tools within MCP list of tools to add tasks for the following user stories and assign them to me as the owner.

**CRITICAL EXECUTION RULES:**
1. **Fetch Story Details**: Use `updateRallyStory` with just `objectId` (e.g., "US1758853") to retrieve story details - this returns full story info including ObjectID needed for task creation
2. **Check Existing Tasks**: Use `getRallyTasks` with `storyId` set to the **numeric ObjectID** (not FormattedID) to find existing tasks
3. **Create Tasks SEQUENTIALLY**: Create tasks ONE AT A TIME to avoid Rally concurrency conflicts - NEVER create multiple tasks in parallel
4. **Assign Owner via additionalFields**: The `owner` parameter doesn't work correctly. Use `additionalFields: {"Owner": "/user/[OWNER_ID]"}` instead
5. **Update Owner After Creation**: If tasks are created without owner, update them using `updateRallyTask` with `additionalFields: {"Owner": "/user/[OWNER_ID]"}`

## User Stories
[List user story IDs and titles here]
- US[ID]: [Title]

## Requirements
- **Total Hours**: Exact 48 hours across all tasks assigned to me
- **Owner Email**: [your.email@coxautoinc.com] _(Use Team Owner Mapping below to auto-resolve Owner ID and Full Name)_
- **Existing Tasks**: Leave any tasks created or owned by others unchanged

## Team Owner Mapping (Email -> Rally Owner ID -> Full Name)
| Email | Rally Owner ID | Full Name |
|-------|----------------|-----------|
| Bao.QuocHuynh@coxautoinc.com | 632186963041 | Bao Huynh |
| Khoa.MinhNguyen@coxautoinc.com | 660712859191 | Khoa Minh Nguyen |
| Nam.HaiNguyen@coxautoinc.com | 817514198011 | Nam Hai Nguyen |
| Nghia.Le@coxautoinc.com | 832646835651 | Nghia Le |
| Trung.TienHua@coxautoinc.com | 644175737127 | Trung TienHua |

> **Note**: When providing your email, the AI will automatically look up your Rally Owner ID and Full Name from this mapping table.

## Task Guidelines (Optional)
[Add any specific requirements for task breakdown, such as:]
- Include implementation, testing, and code review tasks
- Break down work by component or feature area
- Ensure tasks are granular enough for daily tracking

---

## Execution Checklist (For AI Reference)

### Phase 1: Information Gathering
- [ ] For each user story, call `updateRallyStory` with `objectId: "US[ID]"` to get story details
- [ ] Extract the numeric `ObjectID` from each story response
- [ ] Call `getRallyTasks` with `storyId: "[numeric ObjectID]"` to check existing tasks
- [ ] Note any existing tasks owned by others (do not modify these)
- [ ] Calculate hours already assigned vs. hours needed

### Phase 2: Task Planning
- [ ] Plan task breakdown for each story (implementation, code review, testing, etc.)
- [ ] Distribute total hours across all stories proportionally based on PlanEstimate
- [ ] Ensure total hours equals exactly 48 hours

### Phase 3: Task Creation (SEQUENTIAL - ONE AT A TIME)
- [ ] Create each task using `createRallyTask` with:
  - `name`: Task name
  - `storyId`: Numeric ObjectID of the parent story
  - `estimate`: Hours for this task
  - `state`: "Defined"
- [ ] Wait for each task to complete before creating the next one
- [ ] Record all created task IDs

### Phase 4: Owner Assignment
- [ ] Update each created task using `updateRallyTask` with:
  - `objectId`: Task FormattedID (e.g., "TA3725471")
  - `additionalFields`: `{"Owner": "/user/[OWNER_USER_ID]"}`
- [ ] These updates CAN be done in parallel safely

### Phase 5: Verification
- [ ] Fetch tasks for each story again to confirm:
  - All tasks created successfully
  - All tasks assigned to correct owner
  - Total hours equals exactly 48 hours
- [ ] Provide summary table with Task IDs, Names, Hours, and Story assignments
