import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { JiraProject } from '@/types/timesheet';

import { ProjectSwitcher, isProjectScopedRoute } from './project-switcher';

// --- Mock next/navigation ---

const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/absences',
  useSearchParams: () => mockSearchParams,
}));

// --- Mock hooks ---

jest.mock('@/hooks/use-timesheet-settings', () => ({
  useTimesheetSettings: () => ({
    settings: { jiraInstance: 'jiradc', username: 'BaoHQ11', token: 'tok' },
    isConfigured: true,
    isLoaded: true,
  }),
}));

const mockSetSelectedProject = jest.fn();
let mockProjects: JiraProject[] = [];
let mockSelectedProject: JiraProject | null = null;

jest.mock('@/hooks/use-projects', () => ({
  useProjects: () => ({
    projects: mockProjects,
    isLoading: false,
    authError: false,
    selectedProject: mockSelectedProject,
    setSelectedProject: mockSetSelectedProject,
  }),
}));

// --- Fixtures ---

const ALPHA: JiraProject = { id: '1', key: 'ALPHA', name: 'Alpha Project' };
const BETA: JiraProject = { id: '2', key: 'BETA', name: 'Beta Project' };

/**
 * The stored project is re-parsed from localStorage on every read, so it is a
 * different object with the same fields. Selecting it here keeps the tests
 * honest about reference inequality.
 */
const storedCopy = (project: JiraProject): JiraProject => ({ ...project });

const getInput = () =>
  screen.getByRole('combobox') as HTMLInputElement;

const getClearButton = () =>
  document.querySelector<HTMLButtonElement>('[data-slot="combobox-clear"]')!;

beforeEach(() => {
  mockReplace.mockClear();
  mockSetSelectedProject.mockClear();
  mockSearchParams = new URLSearchParams();
  mockProjects = [];
  mockSelectedProject = null;
});

describe('isProjectScopedRoute', () => {
  it('matches scoped routes and their children', () => {
    expect(isProjectScopedRoute('/absences')).toBe(true);
    expect(isProjectScopedRoute('/timesheet/missing-worklogs')).toBe(true);
    expect(isProjectScopedRoute('/timesheet/my-worklogs')).toBe(false);
    expect(isProjectScopedRoute('/autolog')).toBe(false);
  });
});

describe('ProjectSwitcher', () => {
  // --- Clearing ---

  it('clears the selection and drops the project param', async () => {
    const user = userEvent.setup();
    mockProjects = [ALPHA, BETA];
    mockSelectedProject = storedCopy(ALPHA);
    mockSearchParams = new URLSearchParams('project=ALPHA');

    render(<ProjectSwitcher />);

    await user.click(getClearButton());

    expect(mockSetSelectedProject).toHaveBeenCalledWith(null);
    expect(mockReplace).toHaveBeenCalledWith('/absences', { scroll: false });
  });

  it('keeps the selection cleared while the stale project param is still in the URL', async () => {
    const user = userEvent.setup();
    mockProjects = [ALPHA, BETA];
    mockSelectedProject = storedCopy(ALPHA);
    mockSearchParams = new URLSearchParams('project=ALPHA');

    const { rerender } = render(<ProjectSwitcher />);

    await user.click(getClearButton());
    mockSetSelectedProject.mockClear();

    // localStorage is written synchronously, but `router.replace` has not
    // landed yet — the URL still says ALPHA.
    mockSelectedProject = null;
    rerender(<ProjectSwitcher />);

    expect(mockSetSelectedProject).not.toHaveBeenCalled();

    // Now the replace lands: nothing should re-add the param.
    mockReplace.mockClear();
    mockSearchParams = new URLSearchParams();
    rerender(<ProjectSwitcher />);

    expect(mockSetSelectedProject).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  // --- Searching ---

  it('filters the list when typing with a project already selected', async () => {
    const user = userEvent.setup();
    mockProjects = [ALPHA, BETA];
    mockSelectedProject = storedCopy(ALPHA);
    mockSearchParams = new URLSearchParams('project=ALPHA');

    render(<ProjectSwitcher />);

    const input = getInput();
    expect(input).toHaveValue('Alpha Project');

    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Beta');

    expect(input).toHaveValue('Beta');
    expect(await screen.findByText('Beta Project')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Project')).not.toBeInTheDocument();
  });

  it('selects a project from the filtered list', async () => {
    const user = userEvent.setup();
    mockProjects = [ALPHA, BETA];
    mockSelectedProject = storedCopy(ALPHA);
    mockSearchParams = new URLSearchParams('project=ALPHA');

    render(<ProjectSwitcher />);

    const input = getInput();
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Beta');
    await user.click(await screen.findByText('Beta Project'));

    expect(mockSetSelectedProject).toHaveBeenCalledWith(BETA);
    expect(mockReplace).toHaveBeenCalledWith('/absences?project=BETA', {
      scroll: false,
    });
  });

  // --- Deep linking ---

  it('resolves ?project= once the project list arrives', () => {
    mockSearchParams = new URLSearchParams('project=BETA');

    const { rerender } = render(<ProjectSwitcher />);

    // List not loaded yet — the deep link must not be spent.
    expect(mockSetSelectedProject).not.toHaveBeenCalled();

    mockProjects = [ALPHA, BETA];
    rerender(<ProjectSwitcher />);

    expect(mockSetSelectedProject).toHaveBeenCalledWith(BETA);
  });

  it('does not re-apply ?project= after the selection changes', () => {
    mockProjects = [ALPHA, BETA];
    mockSearchParams = new URLSearchParams('project=BETA');

    const { rerender } = render(<ProjectSwitcher />);
    expect(mockSetSelectedProject).toHaveBeenCalledWith(BETA);
    mockSetSelectedProject.mockClear();

    // The user switches to ALPHA before the URL catches up.
    mockSelectedProject = ALPHA;
    rerender(<ProjectSwitcher />);

    expect(mockSetSelectedProject).not.toHaveBeenCalled();
  });

  it('canonicalizes a bare URL from the remembered project', () => {
    mockProjects = [ALPHA, BETA];
    mockSelectedProject = storedCopy(ALPHA);

    render(<ProjectSwitcher />);

    expect(mockReplace).toHaveBeenCalledWith('/absences?project=ALPHA', {
      scroll: false,
    });
  });
});
