# Unit Test Generation Prompt for ATC Repositories

## Context
You are a senior test engineer tasked with creating unit tests for code changes in a feature branch. The tests must meet SonarQube's 100% coverage requirement for new/modified code only.

## Input Variables
- `{{BRANCH}}`: The user's current feature/develop branch name

The agent will automatically:
- Detect the repository based on the current working directory
- Compare against `origin/master` as the target branch

## Task
Generate minimal, focused unit tests that cover **only** the code differences between The user's current feature/develop branch and `origin/master`.

---

## Critical Requirements

### Must Do
1. Achieve 100% test coverage for all new or modified lines of code
2. **Search the repository for existing test patterns** before writing any test
3. Follow existing testing patterns and conventions **EXACTLY** as found in the codebase
4. Keep tests minimal - only test the changed functionality
5. Use descriptive test names that explain the expected behavior

### Must Exclude From Coverage
- Changes in `package.json`, `package-lock.json`, `npm-shrinkwrap.json`
- Configuration files

---

## Pattern Discovery Process

Before writing any test, you MUST search the codebase to discover current patterns:

### Step 1: Find Similar Test Files
Search for existing tests of the same type as the code you're testing:
- For components: Search for `*.test.js` files in similar component directories
- For ducks: Search for tests in `__tests__` folders or co-located `.test.js` files
- For hooks: Search for `use*.test.js` files
- For analytics handlers: Search for `*Analytics*.test.js` files

### Step 2: Analyze Test Structure
Read 2-3 similar test files to identify:
- Import patterns (test utilities, mocks, providers)
- How providers/wrappers are used
- Mock patterns (`jest.mock`, `jest.spyOn`, etc.)
- State setup patterns (preloadedState, initialState)
- Assertion patterns

### Step 3: Match Patterns Exactly
Your generated tests must use the **exact same**:
- Import paths
- Provider/wrapper function signatures
- Mock setups
- State key patterns (e.g., `duck.store` vs `duck.path`)

---

## Common Conventions (All Three Repositories)

### Test File Location & Naming
- **Co-located**: Test file next to source file (e.g., `Component.test.js` next to `Component.js`)
- **Alternative**: `__tests__` folder or `tests/` folder at the same directory level
- **Suffix**: `.test.js`, `.test.jsx`, or `.spec.js`

### Test ID Attribute
All repositories use `data-cmp` as the test ID attribute (configured in `jest.setup.js`).

### Jest Configuration
- **Environment**: jsdom
- **clearMocks**: true (mocks auto-cleared between tests)
- **jest-fail-on-console**: Enabled - tests fail on unexpected console errors/warnings

### Describe Block Naming
- `describe('<ComponentName />', () => {})` - React components (with angle brackets)
- `describe('functionName', () => {})` - Utility functions
- `describe('useHookName', () => {})` - Custom hooks
- `describe('duckCreatorName', () => {})` - Redux duck creators

### Test Case Naming
Use "should" or action-based naming:
- `it('should render correctly with default props', () => {})`
- `it('renders loading state when isLoading is true', () => {})`
- `it('calls onClick handler when button is clicked', () => {})`

---

## Repository-Specific Patterns to Discover

### atc-ui

**Search for these key utilities:**
| Pattern | Search Query |
|---------|--------------|
| Standard component tests | `@atcui-test/standard-tests` |
| Provider wrapper | `@atcui-test/renderWithProviders` |
| Duck testing | `@atc/modular-redux-testing-library` |
| Form testing | `@atcui-test/form-test-utils` |
| Fetch mocking | `jest-fetch-mock` or `global.fetch = mockFetch` |

**Key things to discover from existing tests:**
- How `renderWithProviders` options are structured (`ducks`, `preloadedState`, `device`, `features`)
- How `features` object is formatted (look for `config` property structure)
- Duck state key property (typically `duck.store`)
- Standard test exports (`runStandardComponentTests`, `itMatchesSnapshot`, `componentExists`)

---

### find-car

**Search for these key utilities:**
| Pattern | Search Query |
|---------|--------------|
| Provider wrapper | `@/testUtilities/mockProviders` |
| Fetch mocking | `@bonnet/next/fetch` |
| Router mocking | `next/router` mock patterns |
| Analytics handlers | `reaxl-analytics-handlers` |

**Key things to discover from existing tests:**
- How `mockProviders` options are structured (`component`, `props`, `initialState`, `features`, `brand`)
- Path alias: `@/` maps to `src/` directory
- Duck state key property (typically `duck.path`)
- How analytics handlers use `jest.requireActual` pattern

---

### unified-wallet

**Search for these key utilities:**
| Pattern | Search Query |
|---------|--------------|
| Redux Provider | `@atcui-storybook/redux` |
| Features Provider | `@atc/features` |
| Mock wallet data | `@atc/ui-mocks/wallet-store` |
| Modal mock data | `@atc/ui-mocks/wallet-modal` |
| Syndicated ducks | `@syndicated-wallet/ducks` |
| Shared mocks | `@shared-mocks/` |

**Key things to discover from existing tests:**
- How `Provider` and `makeStore` from `@atcui-storybook/redux` are used
- How `FeaturesProvider` flags are structured
- Duck state key property (typically `duck.store`)
- Fetch mock setup (`mockFetch.enableMocks()`)

---

## Testing Patterns to Search For

### Component Testing
Search existing component tests to discover:
- Provider wrapper usage and options
- `defaultProps` pattern
- State initialization patterns
- Child component/hook mocking

### Duck/Redux Testing
Search duck tests for:
- `@atc/modular-redux-testing-library` usage patterns
- Standard duck tests (`runStandardDuckTests`)
- Action testing (`testDuckCreatorAction`)
- Selector testing patterns

### Hook Testing
Search hook tests for:
- `renderHook` usage from `@testing-library/react`
- Provider wrapper for Redux-connected hooks
- Side effect mocking

### Analytics Handler Testing
Search analytics tests for:
- How `reaxl-analytics` or `reaxl-analytics-handlers` are mocked
- Duck selector mocking for analytics
- `jest.requireActual` extension pattern

### Async/Fetch Testing
Search async tests for:
- Which fetch mock library is used
- How responses are mocked
- `waitFor` and `act` patterns

---

## Console Error Handling

Since `jest-fail-on-console` is enabled, search for console spy patterns:
- `jest.spyOn(console, 'error').mockImplementation()`
- `jest.spyOn(console, 'warn').mockImplementation()`

Use when testing error boundaries, PropTypes warnings, or expected console output.

---

## User Event Handling

Search for `userEvent` usage to determine:
- Modern API: `userEvent.setup()` then `await user.click()`
- Legacy API: Direct `userEvent.click()`

---

## Workflow Summary

1. **Identify changed files** between the user's branch and `origin/master`
2. **For each changed file requiring tests:**
   a. Find 2-3 similar existing test files in the repository
   b. Read and analyze their patterns (imports, mocks, providers, assertions)
   c. Write tests following those exact patterns
3. **Verify** all new/modified lines are covered
4. **Run tests** to validate

## Running Tests

```bash
# Run all tests
npm run test

# Run a specific test file
npm run test {test-file-path}
```

---

## Example Discovery Queries

```bash
# Find component test examples in atc-ui
grep -r "renderWithProviders" --include="*.test.js" packages/

# Find duck test examples
grep -r "runStandardDuckTests" --include="*.test.js" packages/

# Find mockProviders usage in find-car
grep -r "mockProviders" --include="*.test.js" src/

# Find Provider usage in unified-wallet
grep -r "from '@atcui-storybook/redux'" --include="*.test.js" packages/

# Find analytics handler mock patterns
grep -r "jest.mock.*reaxl-analytics" --include="*.test.js" .
```

---

## Final Checklist

Before submitting tests, verify:
- [ ] Searched for and analyzed 2-3 similar existing test files
- [ ] Import paths match existing tests exactly
- [ ] Provider/wrapper usage matches existing patterns
- [ ] Mock patterns are consistent with similar tests
- [ ] State key property matches repository convention
- [ ] All new/modified lines have test coverage
- [ ] Tests pass with `npm run test`
