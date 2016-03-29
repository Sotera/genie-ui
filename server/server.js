'use strict';

// build config for Docker containers
var dockerConf = require('./docker-conf');
dockerConf.updateDatasources();

// to enable these logs set `DEBUG=server:server` or `DEBUG=server:*`
var log = require('debug')('server:server');
var LoopbackModelHelper = require('./util/loopback-model-helper');
/*var twitterClientOptions = {
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
};*/
var cluster = require('cluster');
var boot = require('loopback-boot');
var master = require('./master-red');
//Hijack loopback boot to read config file. Honors NODE_ENV.
var config = boot.ConfigLoader.loadAppConfig(__dirname, process.env.NODE_ENV);

//EXPERIMENTAL -- Here we are going to try to bring up a master process that only hosts NodeRED &
//some process control routes. The 'master' app will not be a loopback app. It will just be a vanilla
//Express4 app. Later we may add loopback for access to in memory database to manage the cluster.
// if (config.clusterOn && cluster.isMaster) {
// HACK: if using slc pm (already clustered), then check if 1st worker.
if (cluster.isMaster || (cluster.isWorker && cluster.worker.id == '1')) {
  master(config, cluster);
} else {
  //EXPERIMENTAL -- If we aren't the master process of the cluster then start up like regular loopback app
  var loopback = require('loopback');
  var path = require('path');
  var app = module.exports = loopback();
  //This should be the only time LoopbackModelHelper is constructed with 'app'
  (new LoopbackModelHelper(app));

  app.use(loopback.favicon(path.join(__dirname, 'waveicon16.png')));

  app.start = function () {
    // start the web server
    return app.listen(function () {
      app.emit('started');
      var baseUrl = app.get('host') + ':' + app.get('port')
      console.log('Web server listening at: %s', baseUrl);
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

