'use strict';

module.exports = function(app, cb) {

  var bodyParser = require('body-parser');
  var loopback = require('loopback');

  // to support JSON-encoded bodies
  app.use(bodyParser.json({limit: '5mb'}));
  // to support URL-encoded bodies
  app.use(bodyParser.urlencoded({
    extended: true, limit:'5mb'
  }));

  //// The access token is only available after boot
  app.use(app.loopback.token({
    model: app.models.accessToken
  }));

  var secret = app.get('cookieSecret');
  app.use(loopback.cookieParser(secret));
  app.use(loopback.session({
    secret,
    saveUninitialized: true,
    resave: true
  }));

  cb();
};
