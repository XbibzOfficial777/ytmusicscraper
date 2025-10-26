// Test setup file for Jest

// Set test timeout to 30 seconds for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock process.env to avoid environment-related issues
process.env = {
  ...process.env,
  NODE_ENV: 'test'
};
