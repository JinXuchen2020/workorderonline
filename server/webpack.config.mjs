// This file is used to configure webpack for building the server bundle.
import path from 'path';
import { fileURLToPath } from 'url';
import copyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).split(path.sep).slice(0, -1).join(path.sep);
const config = {
  mode: 'production',
  entry:'./bin/server.ts',
  devtool: 'inline-source-map',
  output: {
    filename: 'bundle.cjs',
    path: __dirname +'/dist/server'
  },
  module : {
    rules: [
      {
        test: /\.ts?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }
      }
    ]
  },
  resolve:{
    extensions: ['.ts', '.js']
  },
  target: 'node',
  plugins: [
    new copyPlugin({
      patterns: [
        { from: 'public', to: __dirname +'/dist/public' }
      ]
    })
  ]
};

export default config;