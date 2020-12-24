module.exports = {
  extends: ['react-app', 'prettier-standard', 'prettier/react'],
  plugins: ['import'],
  settings: {
    'import/resolver': {
      alias: [['src', './src']]
    }
  },
  rules: {
    'import/no-anonymous-default-export': [2, { allowObject: true }],
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        alphabetize: {
          order: 'asc'
        },
        'newlines-between': 'always'
      }
    ]
  }
}
