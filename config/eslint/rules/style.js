module.exports = {
  rules: {
    'quotes': [
      'error',
      'single',
      {
        avoidEscape: false,
        allowTemplateLiterals: true
      }
    ],
    'array-bracket-spacing': [
      'error',
      'always',
      {
        arraysInArrays: false,
        objectsInArrays: false
      }
    ],
    'object-curly-spacing': [
      'error',
      'always',
      {
        objectsInObjects: false
      }
    ],
    'array-bracket-newline': [
      'error',
      {
        multiline: true,
        minItems: 3
      }
    ],
    'array-element-newline': [
      'error',
      {
        multiline: true,
        minItems: 3
      }
    ],
    'semi': [
      'error',
      'always',
      {
        omitLastInOneLineBlock: false,
        omitLastInOneLineClassBody: false
      }
    ],
    'rest-spread-spacing': [
      'error',
      'never'
    ],
    'key-spacing': [
      'error',
      {
        beforeColon: false,
        afterColon: true,
        mode: 'strict'
      }
    ],
    'brace-style': [
      'error',
      '1tbs',
      {
        allowSingleLine: true
      }
    ],
    'comma-dangle': [
      'error',
      'never'
    ],
    'comma-spacing': [
      'error',
      {
        'before': false,
        'after': true
      }
    ],
    'no-underscore-dangle': [
      'error',
      {
        allow: [],
        allowAfterThis: true,
        allowAfterSuper: true,
        allowAfterThisConstructor: true,
        enforceInMethodNames: false
      }
    ],
    'no-uneeded-ternary': [
      'error'
    ],
    'computed-property-spacing': [
      'error',
      'never',
      {
        enforceForClassMembers: true
      }
    ]
  }
};
