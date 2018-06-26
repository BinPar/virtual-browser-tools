const { defaults } = require('jest-config');

module.exports = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  testResultsProcessor: './node_modules/jest-html-reporter',
  collectCoverage: false,
  coverageDirectory: '.coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/.compiled/',
    '<rootDir>/src/graphQL/schemas',
    '<rootDir>/test',
    '<rootDir>/node_modules/',
    '<rootDir>/package.json',
    '<rootDir>/package-lock.json',
    '<rootDir>/api/jest.config.js',
    '<rootDir>/src/tools/dbPool.js',
    '<rootDir>/src/tools/error.js',
  ],
};
