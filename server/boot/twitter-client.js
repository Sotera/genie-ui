'use strict';
var log = require('debug')('boot:twitter-client');
var TwitterClient = require('../util/twitter-client');
module.exports = function (app, cb) {
  app.post('/testTwitter', function (req, res) {
    var tc = new TwitterClient();
    tc.accountSettings(function (err, tweets, response) {
      if (err) {
        res.status(200).end(err.toString());
      } else {
        res.status(200).end(response.body);
      }
    });
  });
  cb();
}

