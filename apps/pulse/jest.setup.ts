import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.API_BASE_URL = 'http://localhost:3001';

// jsdom ships no ResizeObserver, which Radix's positioning primitives measure
// with — rendering a tooltip or popover would throw without this stub.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
