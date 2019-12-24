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
