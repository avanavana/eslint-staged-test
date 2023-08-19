module.exports = {
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          [ 'parent', 'sibling' ],
          'index'
        ],
        pathGroups: [
          {
            pattern: '{react,react-dom/**,react-native,react-native-*,react-navigation*,expo,?(@)expo*,?(@)expo/**}',
            group: 'external',
            position: 'before'
          },
          {
            pattern: '{../../contexts/*}',
            group: 'parent',
            position: 'before'
          },
          {
            pattern: '{../../hooks/*}',
            group: 'parent',
            position: 'before'
          },
          {
            pattern: '{../../components/*}',
            group: 'sibling',
            position: 'after'
          }
        ],
        pathGroupsExcludedImportTypes: [ 'react' ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ]
  }
}
