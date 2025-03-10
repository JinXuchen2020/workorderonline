#!/usr/bin/env node

/**
 * Module dependencies.
 */
import app from '../app';
import debug from 'debug';
import http from 'http';
import https from 'https';
import fs from 'fs';
// var app = require('../app');
// var debug = require('debug')('server:server');
// var http = require('http');

/**
 * Normalize a port into a number, string, or false.
 */
const normalizePort =(val: string) => {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '80');
var sslPort = normalizePort(process.env.PORT || '443');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);
const options = {
  key: fs.readFileSync('./public/hlchangrun.top_key.key'),
  cert: fs.readFileSync('./public/hlchangrun.top_chain.crt')
};

var vSSLserver = https.createServer(options, app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
vSSLserver.listen(sslPort);

/**
 * Event listener for HTTP server "error" event.
 */
const onError =(error: any)=>{
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
const onListening = () => {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr!.port;
  console.log('Listening on ' + bind);
}

const onSSLListening = () => {
  var addr = vSSLserver.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr!.port;
  console.log('Listening on ' + bind);
}

server.on('error', onError);
server.on('listening', onListening);
server.on('close', () => {
  process.exit(0);
});

vSSLserver.on('error', onError);
vSSLserver.on('listening', onSSLListening);
vSSLserver.on('close', () => {
  process.exit(0);
});
