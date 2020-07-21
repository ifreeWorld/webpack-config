/**
 * @file eslint 配置文件
 * @author sensorsdata.cn
 */

const WARN = 'warn';
const OFF = 'off';

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended'
  ],
  parser: 'babel-eslint',
  plugins: ['react', 'prettier'],
  settings: {
    react: {
      version: '16.8.0'
    }
  },
  rules: {
    // 单引号
    quotes: [2, 'single'],
    'prettier/prettier': WARN,
    'no-console': OFF,
    'no-debugger': OFF,
    'react/prop-types': OFF,
    'react/no-find-dom-node': OFF,
    'react/display-name': OFF,
    "no-empty-pattern": OFF
  }
};
