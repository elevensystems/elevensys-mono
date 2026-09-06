import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AutologTable } from '@/app/autolog/_components/autolog-table';
import type { AutologConfig } from '@/types/autolog';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: (...args: unknown[]) => refresh(...args) }),
}));

const toastSuccess = jest.fn();
const toastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

function makeConfig(overrides: Partial<AutologConfig> = {}): AutologConfig {
  return {
    configId: 'cfg-1',
    username: 'BaoHQ11',
    email: 'baohq11@fpt.com',
    jiraInstance: 'jiradc',
    projectId: '101',
    projectKey: 'ELV',
    projectName: 'Elevensys',
    tickets: [
      { issueKey: 'ELV-1', hours: 8, typeOfWork: 'Development' },
      { issueKey: 'ELV-2', hours: 4, typeOfWork: 'Review' },
    ],
    schedule: {
      type: 'weekly',
      timezone: 'UTC',
      nextRunAt: '2026-09-11T10:00:00.000Z',
      periodAnchorAt: '2026-09-11T10:00:00.000Z',
    },
    status: 'active',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    lastRunAt: '2026-09-04T10:00:00.000Z',
    lastRunStatus: 'success',
    coveragePeriod: { start: '1/Sep/26', end: '5/Sep/26' },
    ...overrides,
  };
}

const OTHER = makeConfig({
  configId: 'cfg-2',
  username: 'AnNT3',
  email: 'annt3@fpt.com',
  projectKey: 'PLS',
  projectName: 'Pulse',
  status: 'paused_auth',
  tickets: [{ issueKey: 'PLS-9', hours: 8, typeOfWork: 'Development' }],
  lastRunAt: undefined,
  lastRunStatus: undefined,
});

/** Owner cell of every rendered body row, in display order. */
function ownerColumn() {
  const rows = screen.getAllByRole('row').slice(1); // drop the header row
  return rows.map(row => within(row).getAllByRole('cell')[0].textContent);
}

function renderTable(
  configs: AutologConfig[],
  loadError: string | null = null
) {
  return render(<AutologTable configs={configs} loadError={loadError} />);
}

describe('AutologTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  });

  // --- Rendering ---
  it('renders one row per configuration with its owner and project', () => {
    renderTable([makeConfig(), OTHER]);

    expect(screen.getByText('BaoHQ11')).toBeInTheDocument();
    expect(screen.getByText('Elevensys')).toBeInTheDocument();
    expect(screen.getByText('AnNT3')).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
  });

  it('displays ticket count and total hours', () => {
    renderTable([makeConfig()]);
    expect(screen.getByText('2 · 12h')).toBeInTheDocument();
  });

  it('displays "Never run" for a config with no last run', () => {
    renderTable([OTHER]);
    expect(screen.getByText('Never run')).toBeInTheDocument();
  });

  it('counts the configs needing re-auth', () => {
    renderTable([makeConfig(), OTHER]);
    expect(screen.getByText('1 need re-auth')).toBeInTheDocument();
  });

  it('displays the load error when the read failed', () => {
    renderTable([], 'Request failed with status 502');
    expect(
      screen.getByText('Request failed with status 502')
    ).toBeInTheDocument();
  });

  it('displays an empty state when there are no configs', () => {
    renderTable([]);
    expect(
      screen.getByText('No autolog configurations found.')
    ).toBeInTheDocument();
  });

  // --- Search ---
  it('filters rows by username', async () => {
    const user = userEvent.setup();
    renderTable([makeConfig(), OTHER]);

    await user.type(
      screen.getByRole('textbox', { name: 'Search configurations' }),
      'annt'
    );

    expect(screen.queryByText('BaoHQ11')).not.toBeInTheDocument();
    expect(screen.getByText('AnNT3')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('filters rows by ticket key', async () => {
    const user = userEvent.setup();
    renderTable([makeConfig(), OTHER]);

    await user.type(
      screen.getByRole('textbox', { name: 'Search configurations' }),
      'PLS-9'
    );

    expect(screen.getByText('AnNT3')).toBeInTheDocument();
    expect(screen.queryByText('BaoHQ11')).not.toBeInTheDocument();
  });

  it('displays a distinct empty state when a search matches nothing', async () => {
    const user = userEvent.setup();
    renderTable([makeConfig()]);

    await user.type(
      screen.getByRole('textbox', { name: 'Search configurations' }),
      'nobody'
    );

    expect(
      screen.getByText('No configurations match this search.')
    ).toBeInTheDocument();
  });

  // --- Sorting ---
  it('sorts by owner ascending by default', () => {
    renderTable([makeConfig(), OTHER]);
    expect(ownerColumn()[0]).toContain('AnNT3');
  });

  it('reverses the sort when the active column is clicked again', async () => {
    const user = userEvent.setup();
    renderTable([makeConfig(), OTHER]);

    await user.click(screen.getByRole('button', { name: 'Sort by Owner' }));

    expect(ownerColumn()[0]).toContain('BaoHQ11');
  });

  it('sorts never-run configs last when sorting by last run', async () => {
    const user = userEvent.setup();
    renderTable([OTHER, makeConfig()]);

    await user.click(screen.getByRole('button', { name: 'Sort by Last run' }));

    expect(ownerColumn()[1]).toContain('AnNT3');
  });

  // --- Detail sheet ---
  it('opens the detail sheet with the owner and schedule when a row is clicked', async () => {
    const user = userEvent.setup();
    renderTable([makeConfig()]);

    await user.click(screen.getByText('Elevensys'));

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('baohq11@fpt.com')).toBeInTheDocument();
    expect(within(sheet).getByText(/^Every Friday/)).toBeInTheDocument();
    expect(within(sheet).getByText('ELV-1')).toBeInTheDocument();
  });

  // --- Delete ---
  it('names the owner in the delete confirmation', async () => {
    const user = userEvent.setup();
    renderTable([makeConfig()]);

    await user.click(
      screen.getByRole('button', {
        name: 'Delete the Elevensys configuration for BaoHQ11',
      })
    );

    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText(/autolog configuration for/)
    ).toBeInTheDocument();
    expect(within(dialog).getByText('BaoHQ11')).toBeInTheDocument();
  });

  it('deletes through the API with the owning username, then refreshes', async () => {
    const user = userEvent.setup();
    renderTable([makeConfig()]);

    await user.click(
      screen.getByRole('button', {
        name: 'Delete the Elevensys configuration for BaoHQ11',
      })
    );
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /Delete/ }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/autolog/cfg-1?username=BaoHQ11',
      { method: 'DELETE' }
    );
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('reports the API error and keeps the row when a delete fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Not allowed' }),
    });
    const user = userEvent.setup();
    renderTable([makeConfig()]);

    await user.click(
      screen.getByRole('button', {
        name: 'Delete the Elevensys configuration for BaoHQ11',
      })
    );
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: /Delete/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Not allowed'));
    expect(refresh).not.toHaveBeenCalled();
    // The row survives, and the dialog stays open so the delete can be retried.
    // `hidden` is needed because the open dialog marks the page behind it
    // aria-hidden, which the default role query filters out.
    expect(
      screen.getByRole('button', {
        name: 'Delete the Elevensys configuration for BaoHQ11',
        hidden: true,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  // --- Refresh ---
  it('refreshes the server data from the page header', async () => {
    const user = userEvent.setup();
    renderTable([makeConfig()]);

    await user.click(screen.getByRole('button', { name: /Refresh/ }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
