module.exports = {
  entry: './src/App.tsx',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  output: {
    filename: './bundle.js'
  },
  resolve: {
    // changed from extensions: [".js", ".jsx"]
    extensions: [".ts", ".tsx", ".js", ".jsx"]
  },
  optimization: {
    usedExports: true,
    sideEffects: false,
  },
  module: {
    rules: [
      // changed from { test: /\.jsx?$/, use: { loader: 'babel-loader' }, exclude: /node_modules/ },
      { test: /\.(t|j)sx?$/, use: { loader: 'ts-loader' }, exclude: /node_modules/ },

      // addition - add source-map support
      { enforce: "pre", test: /\.js$/, exclude: /node_modules/, loader: "source-map-loader" },

      // allow image support
      {
        test: /\.svg$/,
        loader: 'url-loader'
      },
      {
        test   : /\.(ttf|eot|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader : 'file-loader'
      }
    ]
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM",
  },
  // addition - add source-map support
  devtool: "source-map"
}