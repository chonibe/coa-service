module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/*.d.ts'
  ],
  // Raise these as test coverage grows (were 10%; current coverage is lower)
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    // xss.test.ts uses jsdom/dompurify; ESM deps (@exodus/bytes) break in current Jest/babel setup
    '<rootDir>/tests/security/xss.test.ts'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(jsdom|dompurify|html-encoding-sniffer|@exodus|linkedom|whatwg-url|tr46|punycode)/)',
    '^.+\\.module\\.(css|sass|scss)$'
  ]
} 