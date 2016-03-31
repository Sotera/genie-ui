// Def: Start node-red in master process inside an express instance
'use strict';

var http = require('http');
var express = require('express');
var RED = require('node-red');
var app = express();
// to enable these logs set `DEBUG=server:master` or `DEBUG=server:*`
var log = require('debug')('server:master');
var cluster = null;

module.exports = function(config, cluster) {


  var server = http.createServer(app);

  if(process.env.GENIE_HOST){
    config.REDsettings.functionGlobalContext.host = process.env.GENIE_HOST;
  }

  //Initialise the runtime with a server and settings
  RED.init(server, config.REDsettings);
  //Serve the editor UI from /red
  app.use(config.REDsettings.httpAdminRoot, RED.httpAdmin);
  //Serve the http nodes UI from /api
  app.use(config.REDsettings.httpNodeRoot, RED.httpNode);
  server.listen(config.REDsettings.port);
  //Start the runtime
  RED.start();

  if(process.env.USE_NODERED_CLUSTERING == "FALSE"){
    return;
  }

  cluster = require('cluster');

  cluster.on('online', function (worker) {
    log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', function (worker, code, signal) {
    log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
    log('Starting a new worker');
    cluster.fork();
  });

  //Fire up the workers!
  var numWorkers = config.numberOfWorkers;
  numWorkers = (numWorkers === -1)
    ? require('os').cpus().length
    : (numWorkers < 1)
    ? 1
    : (numWorkers > 16)
    ? 16
    : numWorkers;
  console.log('Master cluster setting up ' + numWorkers + ' workers...');
  for (var i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

};
