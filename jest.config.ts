const config = {
  preset: 'ts-jest',
  testPathIgnorePatterns: ['/node_modules/', '/lib/', '/build/'],
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
};

export default config;
