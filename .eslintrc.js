const path = require('path')

module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es6': true,
    'mocha': true
  },
  'extends': 'eslint:recommended',
  'rules': {
    'array-callback-return': 'error',
    'curly': ['error', 'multi-line'],
    'no-empty-function': 'error',
    'no-eq-null': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-implicit-globals': 'error',
    'no-implied-eval': 'error',
    'no-iterator': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-native-reassign': 'error',
    'no-proto': 'error',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-escape': 'error',
    'yoda': ['error', 'never'],
    'no-catch-shadow': 'error',
    'no-shadow-restricted-names': 'error',
    'no-undef': 'error',
    'no-undef-init': 'error',
    'no-mixed-requires': 'error',
    'no-new-require': 'error',
    'array-bracket-spacing': ['error', 'never'],
    'brace-style': ['error', 'stroustrup', { 'allowSingleLine': true }],
    'camelcase': 'error',
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    'comma-style': ['error', 'last'],
    'consistent-this': ['error', 'self'],
    'indent': [
      'error',
      2,
      {
        'VariableDeclarator': {
          'var': 2,
          'let': 2,
          'const': 3
        },
        'SwitchCase': 1
      }
    ],
    'key-spacing': ['error', { 'beforeColon': false }],
    'keyword-spacing': ['error', {
      'after': false,
      'overrides': {
        'case': { 'after': true },
        'const': { 'after': true },
        'do': { 'after': true },
        'else': { 'after': true },
        'from': { 'after': true },
        'import': { 'after': true },
        'let': { 'after': true },
        'return': { 'after': true },
        'try': { 'after': true },
        'export': { 'after': true }
      }
    }],
    'linebreak-style': ['error', 'unix'],
    'lines-around-comment': 0,
    'new-parens': 'error',
    'no-lonely-if': 'error',
    'no-multiple-empty-lines': ['error', {'max': 1}],
    'no-trailing-spaces': 'error',
    'no-unneeded-ternary': 'error',
    'no-whitespace-before-property': 'error',
    'operator-linebreak': ['error', 'after', { 'overrides': { '?': 'ignore', ':': 'ignore' } }],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'semi-spacing': ['error', {'before': false, 'after': true}],
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', 'never'],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': ['error', 'always']
  }
}
