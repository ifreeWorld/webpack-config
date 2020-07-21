# 创建基础通用的 webpack 配置

## 安装

npm:

```shell
$ npm install @ifreeworld/webpack-config
```

## 使用

```javascript
const webpackConfig = require('@ifreeworld/webpack-config');
const needAnalyzer = process.env.needAnalyzer === 'true';
const needSpeedMeasure = process.env.needSpeedMeasure === 'true';
const tinifyApiKey = process.env.tinifyApiKey || ''; // @sea https://tinypng.com/developers

// 创建配置
const config = webpackConfig(__dirname, {
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
    'process.env.DEPLOY_PATH': '"' + DEPLOY_PATH + '"',
    // 旧 APP 的端口号，本地调试时用
    'process.env.OLD_PORT':
      '"' + (isProduction ? '' : process.env.OLD_PORT) + '"'
  },
  port: 8001,
  proxy: {
    '/api/': 'http://10.42.32.129:8107/'
  }
});
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
