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
var loopback = require('loopback');
var boot = require('loopback-boot');
var path = require('path');
var app = module.exports = loopback();
var env = require('get-env')({
  test: 'test'
});

//Startup varies a little from typical loopback because we need access to the http server
//object to properly initialize NodeRED. See 'server/boot/node-red.js' for details.
app.server = require('http').createServer(app);

// Set up the /favicon.ico
app.use(loopback.favicon(path.join(__dirname, 'waveicon16.png')));

// request pre-processing middleware
//app.use(loopback.compress());

boot(app, __dirname, function () {
  var staticPath = null;

  if (env !== 'prod') {
    staticPath = path.resolve(__dirname, '../client/app/');
    console.log("Running app in development mode");
  } else {
    staticPath = path.resolve(__dirname, '../dist/');
    console.log("Running app in production mode");
  }

  app.use(loopback.static(staticPath));

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
  app.use(loopback.urlNotFound());

// The ultimate error handler.
  app.use(loopback.errorHandler());

  app.start = function () {
    // start the web server
    return app.listen(function () {
      app.emit('started');
      console.log('Web server listening at: %s', app.get('url'));
    });
  };

// start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});
