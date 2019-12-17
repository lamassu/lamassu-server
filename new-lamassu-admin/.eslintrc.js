const baseConfig = require('eslint-config-prettier-standard/lib/base')
const basePrettierConfig = baseConfig.rules['prettier/prettier'][1]

module.exports = {
  extends: [
    'react-app',
    'prettier-standard',
    'prettier/react',
  ],
  plugins: ['import'],
  settings: {
    'import/resolver': {
      alias: [
        ['src', './src']
      ]
    }
  },
  rules: {
    'prettier/prettier': [
      'error',
      Object.assign(
        {},
        basePrettierConfig,
        {
          trailingComma: 'all'
        }
      )
    ],
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      // TODO 
      // bug in this version doens't allow alphabetize with newlines-between
      // alphabetize: {
      //   order: 'asc',
      // },
      'newlines-between': 'always',
    }]
   }
}
