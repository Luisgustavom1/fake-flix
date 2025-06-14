export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '@contentModule/(.*)$': '<rootDir>/src/module/content/$1',
    '@identityModule/(.*)$': '<rootDir>/src/module/identity/$1',
    '@sharedModule/(.*)$': '<rootDir>/src/module/shared/module/$1',
    '@sharedLibs/(.*)$': '<rootDir>/src/module/shared/$1',
    '@billingModule/(.*)$': '<rootDir>/src/module/billing/$1',
    '@src/(.*)$': '<rootDir>/src/$1',
    '@testInfra/(.*)$': '<rootDir>/test/$1',
  },
  setupFiles: ['<rootDir>/test/test.setup.ts'],
  verbose: true,
  resetMocks: true,
};
