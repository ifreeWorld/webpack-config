# 创建基础通用的 webpack 配置

## 安装

npm:

```shell
$ npm install @ifreeworld/webpack-config
```

## 使用

webpack.config.js
```javascript
const path = require('path');
const webpackConfig = require('@ifreeworld/webpack-config');

/**
 * 判断开发环境和生产环境作配置上的区分
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * 基础 URL 路径
 */
const DEPLOY_PATH = process.env.DEPLOY_PATH || '';

const needAnalyzer = process.env.needAnalyzer === 'true';
const needSpeedMeasure = process.env.needSpeedMeasure === 'true';
const tinifyApiKey = process.env.tinifyApiKey || ''; // @sea https://tinypng.com/developers

module.exports = webpackConfig(__dirname, {
  isProduction,
  needAnalyzer,
  needSpeedMeasure,
  tinifyApiKey,
  publicPath: DEPLOY_PATH + '/',
  alias: {
    common: path.resolve(__dirname, './src/common'),
    components: path.resolve(__dirname, './src/components'),
    services: path.resolve(__dirname, 'src/services'),
    utils: path.resolve(__dirname, './src/utils'),
    icons: path.resolve(__dirname, './src/assets/icons'),
    file: path.resolve(__dirname, 'src/assets/files'),
    img: path.resolve(__dirname, './src/assets/img')
  },
  globalConstants: {
    // 基础 URL 路径
    'process.env.DEPLOY_PATH': '"' + DEPLOY_PATH + '"'
  },
  port: 8987,
  proxy: {
    '/api/': 'http://www.baidu.com/'
  },
  host: 'localhost'
});
```

src/index.js
```javascript
console.log('入口');
```

src/index.ejs
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no" />
  <title></title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

| 参数 | 值类型 | 描述 |
| :-- | :-- | :-- |
| projectAbsolutePath | `string` | 当前项目的绝对路径 |
| options | `Object` | 选项 |
| isProduction | `boolean` | 是否是正式环境 |
| entry | `string` | 应用入口文件路径，默认为 `./src/index.js` |
| template | `string` | 应用 HTML 文件路径 |
| favicon | `string` | favicon 文件路径 |
| publicPath | `string` | 基础路径，默认为 `/` |
| alias | `Object` | 编译时的别名 |
| globalConstants | `Object` | 编译的全局常量 |
| port | `number` | devServer 端口号 |
| proxy | `Object` | devServer 代理配置 |
| extraTheme | `Object` | 自定义扩展 theme |
| needAnalyzer | `Boolean` | 是否需要生成代码分析报告 |
| needSpeedMeasure | `Boolean` | 是否开启打包速度分析工具 |
