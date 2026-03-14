const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const appDir = __dirname;
const STUBS = path.resolve(appDir, 'web-stubs');

module.exports = (env, argv) => {
  const isProd = argv ? argv.mode === 'production' : true;

  return {
    entry: path.resolve(appDir, 'index.web.js'),
    output: {
      path: path.resolve(appDir, 'dist-web'),
      filename: '[contenthash].bundle.js',
      clean: true,
      publicPath: '/',
    },
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'eval-source-map',

    resolve: {
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.json'],
      mainFields: ['browser', 'module', 'main'],
      fullySpecified: false,
      fallback: {
        fs: false,
        path: false,
        crypto: false,
        'process/browser': require.resolve('process/browser'),
        url: require.resolve('url'),
        util: require.resolve('util'),
        buffer: require.resolve('buffer'),
        assert: require.resolve('assert'),
      },
      alias: {
        'react-native$': 'react-native-web',
        'react': path.resolve(appDir, 'node_modules/react'),
        'react-native-safe-area-context': path.join(STUBS, 'safe-area-context.js'),
        'react-native-screens': path.join(STUBS, 'screens.js'),
      },
    },

    module: {
      rules: [
        {
          test: /\.(js|mjs)$/,
          include: /node_modules/,
          type: 'javascript/auto',
          resolve: { fullySpecified: false },
        },
        {
          test: /\.[jt]sx?$/,
          include: [
            path.resolve(appDir, 'src'),
            path.resolve(appDir, 'App.tsx'),
            path.resolve(appDir, 'index.web.js'),
            path.resolve(STUBS),
            path.resolve(appDir, 'node_modules/react-native-web'),
            path.resolve(appDir, 'node_modules/@react-navigation'),
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['module:@react-native/babel-preset'],
              plugins: [
                ['@babel/plugin-transform-flow-strip-types'],
                ['@babel/plugin-transform-runtime', { helpers: true }],
              ],
            },
          },
        },
        {
          test: /\.(png|jpg|gif|svg|ttf|woff|woff2|eot)$/,
          type: 'asset/resource',
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(appDir, 'web-index.html'),
        filename: 'index.html',
      }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProd),
        'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new CopyPlugin({
        patterns: [
          { from: '**/*.png', context: path.resolve(appDir, 'public'), to: '[name][ext]' },
        ],
      }),
    ],

    devServer: {
      historyApiFallback: true,
      port: 8080,
      proxy: [
        {
          context: ['/api', '/uploads'],
          target: 'http://localhost:3001',
        },
      ],
    },

    performance: { hints: false },
  };
};
