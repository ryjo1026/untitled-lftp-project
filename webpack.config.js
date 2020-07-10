const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const htmlPlugin = new HtmlWebpackPlugin({
  filename: './index.html',
  template: './src/templates/index.html',
});

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/web/index.tsx',
  output: {
    // NEW
    path: path.join(__dirname, 'dist/static'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
  // Generate HTML referencing bundle
  plugins: [htmlPlugin],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};
