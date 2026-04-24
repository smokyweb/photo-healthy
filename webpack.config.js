const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const babelConfig = {
  presets: [
    ['@babel/preset-env', {
      targets: { browsers: ['last 2 versions'] },
      modules: 'commonjs', // Use CJS to avoid ESM issues with @babel/runtime
    }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    ['module-resolver', { alias: { 'react-native': 'react-native-web' } }],
  ],
};

module.exports = {
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'dist-web'),
    filename: '[contenthash].bundle.js',
    publicPath: '/',
    clean: false,
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native/Libraries/Utilities/codegenNativeComponent': 'react-native-web/dist/cjs/index',
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-gesture-handler)\/).*/,
        use: { loader: 'babel-loader', options: babelConfig },
      },
      {
        test: /\.(png|jpg|gif|svg|ico)$/,
        use: { loader: 'url-loader', options: { limit: 8192 } },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './web-index.html',
      filename: 'index.html',
    }),
  ],
  optimization: {
    minimize: true,
  },
};
