import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.API_BASE_URL = 'http://localhost:3001';
process.env.COGNITO_DOMAIN = 'test-domain';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.COGNITO_SCOPES = 'openid profile email';
process.env.COGNITO_REQUIRED_GROUP = 'staff';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3002';

// jsdom ships no ResizeObserver, which Radix's positioning primitives measure
// with — rendering a tooltip or popover would throw without this stub.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom ships no matchMedia either, and `useIsMobile` calls it on mount.
// Always desktop: the components under test render their wide layout.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
