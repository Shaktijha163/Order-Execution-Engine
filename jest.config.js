module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
  globals: {
    'ts-jest': {
      tsconfig: {
        types: ['jest', 'node']
      }
    }
  }
};


// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   roots: ['<rootDir>/tests'],
//   testMatch: ['**/*.test.ts'],
//   collectCoverageFrom: [
//     'src/**/*.ts',
//     '!src/server.ts',
//     '!src/**/*.d.ts',
//   ],
//   coverageDirectory: 'coverage',
//   coverageReporters: ['text', 'lcov', 'html'],
//   setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
//   moduleNameMapper: {
//     '^@/(.*): '<rootDir>/src/$1',
//   },
//   testTimeout: 30000,
//   verbose: true,
//   globals: {
//     'ts-jest': {
//       tsconfig: {
//         types: ['jest', 'node']
//       }
//     }
//   }
// };