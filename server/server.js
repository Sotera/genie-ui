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

app.RED = require('node-red');
app.server = require('http').createServer(app);

//NodeRED-->BEGIN
//Monkey patch loopback/application.listen because we need the actual http.server object to initialize NodeRED
app.listen = function (cb) {
  var self = this;

  var server = this.server;

  server.on('listening', function () {
    self.set('port', this.address().port);

    var listeningOnAll = false;
    var host = self.get('host');
    if (!host) {
      listeningOnAll = true;
      host = this.address().address;
      self.set('host', host);
    } else if (host === '0.0.0.0' || host === '::') {
      listeningOnAll = true;
    }

    if (!self.get('url')) {
      if (process.platform === 'win32' && listeningOnAll) {
        // Windows browsers don't support `0.0.0.0` host in the URL
        // We are replacing it with localhost to build a URL
        // that can be copied and pasted into the browser.
        host = 'localhost';
      }
      var url = 'http://' + host + ':' + self.get('port') + '/';
      self.set('url', url);
    }
  });

  var useAppConfig =
    arguments.length === 0 ||
    (arguments.length == 1 && typeof arguments[0] == 'function');

  if (useAppConfig) {
    server.listen(this.get('port'), this.get('host'), cb);
  } else {
    server.listen.apply(server, arguments);
  }
  app.RED.start();
  return server;
};
//NodeRED-->END

// Set up the /favicon.ico
app.use(loopback.favicon(path.join(__dirname, 'waveicon16.png')));

// request pre-processing middleware
app.use(loopback.compress());

// -- Add your pre-processing middleware here --


// boot scripts mount components like REST API
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
