// Flat ESLint config (ESLint 9) — Expo preset + Prettier compatibility.
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  eslintConfigPrettier,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*', 'backend/*', 'assets/*'],
  },
  {
    rules: {
      // Surfaced as errors by tsconfig already; keep ESLint focused on style/correctness.
      'import/no-unresolved': 'off',
      // The experimental react-hooks `refs` rule misfires on the idiomatic React Native
      // `useRef(new Animated.Value(x)).current` pattern (an Animated.Value is a stable
      // mutable container, safe to read during render). Disabled deliberately.
      'react-hooks/refs': 'off',
    },
  },
];
