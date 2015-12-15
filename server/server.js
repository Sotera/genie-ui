'use strict';
/*
 var mongoAddr = '"' + process.env.MONGO_PORT_27017_TCP_ADDR + '"';
 var mongoPort = process.env.MONGO_PORT_27017_TCP_PORT;
 var fs = require('fs');

 var fileContents = fs.readFileSync(__dirname + '/datasources-template.json', 'utf8');
 fileContents = fileContents.replace(/MONGO_HOST_ADDR/g, mongoAddr);
 fileContents = fileContents.replace(/MONGO_HOST_PORT/g, mongoPort);
 fs.writeFileSync(__dirname + '/datasources.json', fileContents);
 */

// to enable these logs set `DEBUG=server:server` or `DEBUG=server:*`
var log = require('debug')('server:server');
var cluster = require('cluster');
var boot = require('loopback-boot');
var master = require('./master-red');
//Hijack loopback boot to read config file. Honors NODE_ENV.
var config = boot.ConfigLoader.loadAppConfig(__dirname, process.env.NODE_ENV);

//EXPERIMENTAL -- Here we are going to try to bring up a master process that only hosts NodeRED &
//some process control routes. The 'master' app will not be a loopback app. It will just be a vanilla
//Express4 app. Later we may add loopback for access to in memory database to manage the cluster.
if (config.clusterOn && cluster.isMaster) {
  master(config, cluster);
} else {
  //EXPERIMENTAL -- If we aren't the master process of the cluster then start up like regular loopback app
  var loopback = require('loopback');
  var path = require('path');
  var app = module.exports = loopback();

  app.use(loopback.favicon(path.join(__dirname, 'waveicon16.png')));

  app.start = function () {
    // start the web server
    return app.listen(function () {
      app.emit('started');
      var baseUrl = app.get('url').replace(/\/$/, '');
      console.log('Web server listening at: %s', baseUrl);
      if (app.get('loopback-component-explorer')) {
        var explorerPath = app.get('loopback-component-explorer').mountPath;
        console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
      }
    });
  };

  // Bootstrap the application, configure models, datasources and middleware.
  // Sub-apps like REST API are mounted via boot scripts.
  boot(app, __dirname, function (err) {
    if (err) {
      throw err;
    }

    var staticPath = path.resolve(__dirname, '../client/app/');

    app.use(loopback.static(staticPath));
    app.use(loopback.urlNotFound());
    app.use(loopback.errorHandler());

    // start the server if `$ node server.js`
    if (require.main === module) {
      app.start();
    }
  });
}

