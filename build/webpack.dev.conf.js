/* Development config */

const webpack = require('webpack');
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')

const devWebpackConfig = merge(baseWebpackConfig, {
  mode: 'development',
  devtool: 'cheap-eval-source-map',
  devServer: {
    contentBase: baseWebpackConfig.externals.paths.dist,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    port: 8000
  },
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map'
    })
  ]
})

module.exports = new Promise((resolve, reject) => {
  resolve(devWebpackConfig)
})