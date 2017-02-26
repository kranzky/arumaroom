module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true
  },
  globals: {
    'cordova': true,
    'Velocity': true,
    'DEV': true,
    'PROD': true,
    '__THEME': true
  },
  extends: 'standard',
  plugins: [
    'html'
  ],
  'rules': {
    'arrow-parens': 0,
    'one-var': 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'brace-style': [2, '1tbs', { 'allowSingleLine': true }]
  }
}
