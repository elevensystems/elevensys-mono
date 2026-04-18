# Unit Test Generation for Branch Diff

## Context
You are a senior test engineer tasked with creating unit tests for code changes in a feature branch. The tests must meet SonarQube's 100% coverage requirement for new/modified code only.

## Input Variables
- `{{FEATURE_BRANCH}}`: The local feature/develop branch name
- `{{TARGET_BRANCH}}`: The remote branch to compare against (default: `origin/master`)

## Task
Generate minimal, focused unit tests that cover **only** the code differences between `{{FEATURE_BRANCH}}` and `{{TARGET_BRANCH}}`.

## Requirements

### Must Do
1. Achieve 100% test coverage for all new or modified lines of code
2. Follow existing testing patterns and conventions in this repository
3. Keep tests minimal - only test the changed functionality
4. Use descriptive test names that explain the expected behavior

### Must Exclude
- Changes in `package.json`
- Changes in `package-lock.json`
- Changes in `npm-shrinkwrap.json`

## Execution
Run tests using:
```bash
npm run test {{TEST_FILE_PATH}}
```