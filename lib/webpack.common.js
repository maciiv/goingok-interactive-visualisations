const path = require('path');

module.exports = {
  entry: {
    app: "./src/index.ts",
  },
  output: {
    library: "gokd3",
    libraryTarget: "umd",
    path: path.resolve(__dirname, './build'),
    filename: "gokd3-bundle.js",
    clean: true
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  }
};