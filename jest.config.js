module.exports = {
  testRegex: 'test.ts',
  coverageDirectory: './coverage/',
  collectCoverage: true,
  coverageReporters: ['json', 'html', 'text', 'text-summary', 'lcov'],
  collectCoverageFrom: ['src/**/*.ts'],
  resetMocks: false,
};
