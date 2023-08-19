module.exports = {
  extends: [
    './rules/style',
    './rules/import',
    './rules/react',
    './rules/react-native'
  ].map(require.resolve),
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {}
};
