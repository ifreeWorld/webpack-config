const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const SpeedMeasureWebpackPlugin = require('speed-measure-webpack-plugin');
const threadLoader = require('thread-loader');
// thread-loader “热身”
threadLoader.warmup({}, [
  'babel-loader',
  '@babel/preset-env',
  '@babel/preset-react',
  'css-loader'
]);

/**
 * 创建配置
 *
 * @param {string} projectAbsolutePath 当前项目的绝对路径
 * @param {Object=} options 选项
 * @param {boolean=} isProduction 是否是正式环境
 * @param {boolean=} needAnalyzer 是否需要生成代码分析报告
 * @param {boolean=} needSpeedMeasure 是否开启打包速度分析工具
 * @param {string=} tinifyApiKey tinypng压缩api key
 * @param {string=} entry 应用入口文件
 * @param {string=} template 应用 HTML 文件路径
 * @param {string=} favicon favicon 文件路径
 * @param {string=} publicPath 基础路径
 * @param {Object=} alias webpack 编译时的别名配置
 * @param {Object=} globalConstants 编译的全局常量
 * @param {number=} port devServer 端口号
 * @param {Object=} proxy devServer 代理配置
 */

module.exports = (projectAbsolutePath, options, customConfig = {}) => {
  const {
    isProduction = false,
    needAnalyzer = false,
    needSpeedMeasure = false,
    tinifyApiKey = '',
    entry = './src/index.js',
    template = 'src/index.ejs',
    favicon = '',
    publicPath = '/',
    alias = {},
    globalConstants = {},
    port = 8001,
    proxy = {},
    host = '0.0.0.0'
  } = options;

  const config = merge(
    {
      entry,
      output: {
        path: path.resolve(projectAbsolutePath, 'dist'),
        publicPath,
        filename: isProduction
          ? '[name].[chunkhash:8].js'
          : '[name].[hash:8].js',
        libraryTarget: 'umd'
      },
      ...(isProduction
        ? {
            mode: 'production',
            stats: 'minimal'
          }
        : {}),
      optimization: {
        minimize: isProduction,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: Infinity,
          minSize: 0,
          cacheGroups: (() => {
            // 打包分块规则
            const chunkRules = [
              // react 领域
              (name) => {
                if (/^dva|redux|react/.test(name)) {
                  return 'react';
                }
              },

              // rc 组件
              (name) => {
                if (/^rc-/.test(name)) {
                  return 'rc';
                }
              },

              // polyfill
              (name) => {
                if (
                  /polyfill|babel|core-js|object-assign|isarray|symbol-observable|is-plain-object|isobject|async-validator/.test(
                    name
                  )
                ) {
                  return 'polyfill';
                }
              },

              // moment
              (name) => {
                if (/moment/.test(name)) {
                  return 'moment';
                }
              },

              // lodash
              (name) => {
                if (/lodash/.test(name)) {
                  return 'lodash';
                }
              },

              // echarts，bzcharts
              (name) => {
                if (/bizcharts/.test(name)) {
                  return 'bizcharts';
                }
              },

              // antv
              (name) => {
                if (/^@antv/.test(name)) {
                  return 'antv';
                }
              },

              // antd
              (name) => {
                if (/antd|@ant-design|sa-antd/.test(name)) {
                  return 'antd';
                }
              },

              // intl-message
              (name, context) => {
                if (/intl-messages/.test(context)) {
                  return 'intl';
                }
              },

              // 组件
              (name) => {
                if (/^@sc/.test(name)) {
                  return 'sc';
                }
              },

              // 默认
              () => {
                return 'other';
              }
            ];
            return {
              bundle: {
                // 排除业务单元;
                test: /[\\/]node_modules/,
                name(module) {
                  // 获取包名
                  const packageName = module.context.match(
                    /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                  )[1];
                  for (let rule of chunkRules) {
                    const filename = rule(packageName, module.context);
                    if (filename) {
                      return filename;
                    }
                  }
                }
              },
              initial: {
                test: /[\\/]node_modules/,
                name: 'app.initial',
                chunks: 'initial'
              },
              dynamic: {
                test: /[\\/]node_modules/,
                name(module) {
                  // 获取包名
                  const match = module.context.match(
                    /[\\/]node_modules[\\/](.*?)[\\/](.*?)([\\/]|$)/
                  );
                  return `app.${match[2]}.dynamic`;
                },
                chunks: 'async',
                enforce: true
              }
            };
          })()
        }
      },
      resolve: {
        alias,
        extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx', '.ts', '.tsx']
      },
      plugins: [
        new webpack.DefinePlugin(globalConstants),
        new HtmlWebpackPlugin({
          template,
          favicon,
          // 控制打包分块的加载顺序
          chunksSortMode: (chunk1, chunk2) => {
            const order = [
              'polyfill',
              'lib',
              'antv',
              'component',
              'app',
              'main'
            ];
            return (
              order.indexOf(chunk1.names[0].split('.')[0]) -
              order.indexOf(chunk2.names[0].split('.')[0])
            );
          },
          // prefetch assets
          templateParameters: (compilation) => {
            const prefetchAssets = Object.keys(compilation.assets)
              .filter((item) => /\.dynamic\./.test(item))
              .map((item) => `${publicPath}${item}`);
            return {
              prefetchAssets
            };
          }
        }),
        new MiniCssExtractPlugin({
          filename: isProduction
            ? '[name].[chunkhash:8].css'
            : '[name].[hash:8].css'
        }),
        // 只打包 moment.js 中的英文、中文、繁体中文 locale 包: 227KB => 62KB;
        new webpack.ContextReplacementPlugin(
          /moment[/\\]locale$/,
          /en|zh-cn|zh-tw/
        ),
        // 只打包用到的 lodash 方法: 107KB => 44KB(SA测试);
        new LodashModuleReplacementPlugin({
          // 默认开启所有 feature sets，降低配置成本;
          // 体积增大十几KB，可以接受;
          shorthands: true,
          cloning: true,
          currying: true,
          caching: true,
          collections: true,
          exotics: true,
          guards: true,
          metadata: true,
          deburring: true,
          unicode: true,
          chaining: true,
          memoizing: true,
          coercions: true,
          flattening: true,
          paths: true,
          placeholders: true
        }),
        ...(isProduction ? [new OptimizeCssAssetsPlugin()] : []),
        ...(needAnalyzer ? [new BundleAnalyzerPlugin()] : [])
      ],
      module: {
        rules: [
          /**
           * 添加对组件中 less 和 CSS Modules 的支持
           * @see https://github.com/webpack-contrib/css-loader
           */
          {
            test: /\.less$/,
            use: [
              isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
              {
                loader: 'css-loader',
                options: {
                  modules: {
                    localIdentName: '[name]__[local]___[hash:base64:5]'
                  },
                  importLoaders: 1
                }
              },
              {
                loader: 'less-loader',
                // 添加主题文件到 less 变量配置中
                options: {
                  javascriptEnabled: true
                }
              }
            ],
            include: [
              // 应用源码目录
              path.resolve(projectAbsolutePath, './src'),
              path.resolve(projectAbsolutePath, './demo')
            ]
          },
          /**
           * 需要单独编译的外部组件 less 文件
           */
          {
            test: /\.less$/,
            use: [
              isProduction
                ? MiniCssExtractPlugin.loader
                : {
                    loader: 'style-loader',
                    options: {
                      insert: 'head'
                    }
                  },
              'css-loader',
              {
                loader: 'less-loader',
                // 添加主题文件到 less 变量配置中
                options: {
                  javascriptEnabled: true
                }
              }
            ],
            include: [
              // antd 样式
              path.resolve(projectAbsolutePath, './node_modules/antd')
            ]
          },
          /**
           * 添加对 CSS 的支持
           */
          {
            test: /\.css$/,
            use: ['style-loader', 'thread-loader', 'css-loader']
          },
          /**
           * 需要 Babel 编译的 JS
           */
          {
            test: /\.jsx?$/,
            use: [
              'thread-loader',
              {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env', '@babel/preset-react'],
                  plugins: [
                    ['@babel/plugin-proposal-decorators', { legacy: true }],
                    [
                      '@babel/plugin-proposal-class-properties',
                      { loose: true }
                    ],
                    '@babel/plugin-proposal-export-default-from',
                    [
                      'import',
                      {
                        libraryName: 'antd',
                        libraryDirectory: 'es',
                        style: true
                      }
                    ],
                    'lodash'
                  ]
                }
              }
            ],
            include: [
              // 应用源码目录
              path.resolve(projectAbsolutePath, './src'),
              path.resolve(projectAbsolutePath, './demo')
            ]
          },
          {
            test: /\.(tsx|ts)?$/,
            use: [
              'thread-loader',
              {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-env',
                    '@babel/preset-react',
                    '@babel/preset-typescript'
                  ],
                  plugins: [
                    ['@babel/plugin-proposal-decorators', { legacy: true }],
                    [
                      '@babel/plugin-proposal-class-properties',
                      { loose: true }
                    ],
                    '@babel/plugin-proposal-export-default-from',
                    [
                      'import',
                      {
                        libraryName: 'antd',
                        libraryDirectory: 'es',
                        style: true
                      }
                    ],
                    'lodash'
                  ]
                }
              }
            ]
          },
          /**
           * svg压缩
           */
          {
            test: /\.svg$/,
            use: [
              {
                loader: 'url-loader',
                options: {
                  limit: 100000
                }
              },
              {
                loader: 'svgo-loader',
                options: {
                  plugins: [{ removeViewBox: false }]
                }
              }
            ]
          },
          /**
           * 图片压缩
           */
          {
            test: /\.(png|jpe?g)$/,
            use: [
              {
                loader: 'url-loader',
                options: {
                  limit: 100000
                }
              },
              ...(tinifyApiKey
                ? [
                    {
                      loader: 'webpack-tinypng-loader',
                      options: {
                        apikey: tinifyApiKey
                      }
                    }
                  ]
                : [])
            ]
          },
          /**
           * 其他静态资源
           */
          {
            test: /\.(woff|woff2|eot|ttf|gif)$/,
            loader: 'url-loader',
            options: {
              limit: 100000
            }
          },
          /**
           * 需要下载的静态资源(txt, xlsx)，直接引用路径
           * 因为 Edge 浏览器不能下载base64编码文件
           */
          {
            test: /\.(txt|xlsx|xls)$/,
            loader: 'file-loader',
            options: {
              outputPath: 'assets'
            }
          },
          /**
           * 支持模块化引入html文件
           */
          {
            test: /\.(html)$/,
            use: {
              loader: 'html-loader'
            }
          }
        ]
      },
      devServer: {
        // 端口号，webpack-dev-server --port 8080
        port,
        host,
        // 适应 History API，404 跳到 index.html
        historyApiFallback: true,
        // 启动服务后打开浏览器
        open: true,
        // 启动热更新
        hot: true,
        inline: true,
        // 编译错误显示到页面中
        overlay: {
          errors: true
        },
        proxy
      }
    },
    customConfig
  );

  if (needSpeedMeasure) {
    const smwp = new SpeedMeasureWebpackPlugin();
    return smwp.wrap(config);
  }

  return config;
};
