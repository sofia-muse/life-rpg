module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@zamplyy/.*|zustand))',
  ],
  collectCoverageFrom: [
    'src/engine/**/*.ts',
    'src/config/xpTables.ts',
    'src/store/**/*.ts',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    './src/engine/': { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
};
