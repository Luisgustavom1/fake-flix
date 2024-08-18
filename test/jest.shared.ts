export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '@contentModule/(.*)$': '<rootDir>/src/module/content/$1',
    '@sharedModule/(.*)$': '<rootDir>/src/module/shared/module/$1',
    '@src/(.*)$': '<rootDir>/src/$1',
    '@prisma/(.*)$': '<rootDir>/prisma/$1',
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
  verbose: true,
  resetMocks: true,
};
