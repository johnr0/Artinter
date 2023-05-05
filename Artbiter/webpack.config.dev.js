var path = require('path');
var webpack = require('webpack');

var HTMLWebpackPlugin = require('html-webpack-plugin');

var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
  template: path.join(__dirname, 'client', 'index.html'),
  filename: 'index.html',
  inject: 'body' 
});

module.exports = {
  devtool: 'cheap-module-source-map',
  externals: {
    'cheerio': 'window',
    'react/lib/ExecutionEnvironment': true,
    'react/lib/ReactContext': true,
  },
  entry: [
    'eventsource-polyfill', // necessary for hot reloading with IE
    'webpack-hot-middleware/client',
    './client/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.ProvidePlugin({
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    }),
    HTMLWebpackPluginConfig
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?/,
        loader: 'babel',
        include: path.join(__dirname, 'client'),
        exclude: [/(node_modules|bower_components)/, /\.test\.jsx?$/],
        query: {
          presets: ['airbnb', 'react', 'es2015', 'stage-0'],
          plugins: [[
            'transform-object-rest-spread',
            'react-transform', {
              transforms: [{
                transform: 'react-transform-hmr',
                imports: ['react'],
                locals: ['module']
            }]
          }]]
        }
      },
      { test: /\.woff2?$/,      loader: "url-loader?limit=10000&minetype=application/font-woff" },
      { test: /\.ttf$/,         loader: "file-loader" },
      { test: /\.eot$/,         loader: "file-loader" },
      { test: /\.svg$/,         loader: "file-loader" },
      { test: /\.(png|gif)$/,   loader: "file-loader" },
      { test: /\.(sass|scss)$/, loader: 'style!css!sass'},
      { test: /\.json$/,        loader: "json-loader"},
      { test: /\.css$/, loader: "style-loader!css-loader" },
    ]
  }
};
