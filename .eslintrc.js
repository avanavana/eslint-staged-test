module.exports = {
	root: true,
	env: {
		node: true,
		browser: true,
		es2021: true,
		'react-native/react-native': true
	},
	extends: [
		'eslint:recommended',
		'airbnb',
		'airbnb/hooks',
		'plugin:react/recommended',
		'./config/eslint/index.js'
	],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
	plugins: ['import', 'react', 'react-native'],
	ignorePatterns: ['!.*', 'dist', 'node_modules', 'patches'],
	rules: {},
	settings: {
		react: {
			version: 'detect'
		}
	}
};
