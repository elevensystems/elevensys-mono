import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getVisibleToolPaths } from '@/lib/sidebar-tools-server';

import ToolsLayout from './layout';

jest.mock('next/headers', () => ({ headers: jest.fn() }));
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
jest.mock('@/lib/sidebar-tools-server', () => ({
  getVisibleToolPaths: jest.fn(),
}));

const mockHeaders = headers as jest.MockedFunction<typeof headers>;
const mockVisible = getVisibleToolPaths as jest.MockedFunction<
  typeof getVisibleToolPaths
>;

function atPath(pathname: string) {
  mockHeaders.mockResolvedValue({
    get: (name: string) => (name === 'x-pathname' ? pathname : null),
  } as unknown as Awaited<ReturnType<typeof headers>>);
}

const render = () => ToolsLayout({ children: <span>tool</span> });

describe('ToolsLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders any tool when no allowlist is set', async () => {
    mockVisible.mockResolvedValue(null);
    atPath('/tools/translately');

    await expect(render()).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('renders a tool that is on the allowlist', async () => {
    mockVisible.mockResolvedValue(['/tools/passly', '/tools/urlify']);
    atPath('/tools/passly');

    await expect(render()).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('404s a tool that is not on the allowlist', async () => {
    mockVisible.mockResolvedValue(['/tools/passly']);
    atPath('/tools/translately');

    await expect(render()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('404s every tool when the allowlist is empty', async () => {
    mockVisible.mockResolvedValue([]);
    atPath('/tools/passly');

    await expect(render()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('404s when the path header is missing and an allowlist is set', async () => {
    mockVisible.mockResolvedValue(['/tools/passly']);
    mockHeaders.mockResolvedValue({ get: () => null } as unknown as Awaited<
      ReturnType<typeof headers>
    >);

    await expect(render()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
