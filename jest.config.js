const defineJestConfig = require('@tarojs/test-utils-react/dist/jest').default

module.exports = defineJestConfig({
  testMatch: ['<rootDir>/__test__/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/__test__/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '@tarojs/components$': '<rootDir>/__test__/mocks/taro-components.tsx',
    '\\.(css|less|scss|sass)$': '<rootDir>/__test__/mocks/style.js',
  },
  collectCoverageFrom: [
    '<rootDir>/src/{api,stores,utils}/**/*.{ts,tsx}',
    '!<rootDir>/src/**/*.d.ts',
  ],
})
