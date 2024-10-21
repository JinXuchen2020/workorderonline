// This file is used to configure webpack for building the server bundle.
import path from 'path';
import { fileURLToPath } from 'url';
import copyPlugin from 'copy-webpack-plugin';
import dotenv from 'dotenv';
import pkg from 'webpack';
const { DefinePlugin } = pkg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).split(path.sep).slice(0, -1).join(path.sep);
const config = {
  mode: 'production',
  entry:'./bin/server.ts',
  devtool: 'inline-source-map',
  output: {
    filename: 'server.cjs',
    path: __dirname +'/dist'
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
        { from: 'public', to: __dirname +'/dist/public' },
        // { from: 'vercel.json', to: __dirname +'/dist/vercel.json' }
      ]
    }),
    new DefinePlugin({
      'process.env.ADMIN_USER_ID': JSON.stringify(process.env.ADMIN_USER_ID),
      'process.env.WE_CHAT_CORP_ID': JSON.stringify(process.env.WE_CHAT_CORP_ID),
      'process.env.WE_CHAT_REDIRECT_URI': JSON.stringify(process.env.WE_CHAT_REDIRECT_URI),
      'process.env.WE_CHAT_CORP_SECRET': JSON.stringify(process.env.WE_CHAT_CORP_SECRET),
      'process.env.WE_CHAT_AGENT_ID': JSON.stringify(process.env.WE_CHAT_AGENT_ID),
      'process.env.WE_CHAT_AGENT_SECRET': JSON.stringify(process.env.WE_CHAT_AGENT_SECRET)
    })
  ]
};

export default config;