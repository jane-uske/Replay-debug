const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  devtool: 'cheap-module-source-map',
  entry: {
    content: './src/content/index.ts',
    background: './src/background/index.ts',
    popup: './src/popup/index.ts',
    replay: './src/replay/index.tsx',
    inject: [
      './src/inject/network-intercept.ts',
      './src/inject/console-intercept.ts',
      './src/inject/route-intercept.ts',
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/popup.html', to: 'popup.html' },
        { from: 'public/replay.html', to: 'replay.html' },
        { from: 'public/icons', to: 'icons' },
      ],
    }),
  ],
  optimization: {
    splitChunks: false,
  },
};
