export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '@src/(.*)$': '<rootDir>/src/$1',
    '@prisma/(.*)$': '<rootDir>/prisma/$1',
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
  verbose: true,
  resetMocks: true,
};
