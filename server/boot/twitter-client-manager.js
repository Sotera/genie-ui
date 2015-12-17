'use strict';
var log = require('debug')('boot:twitter-client');
var TwitterClient = require('../util/twitter-client');
module.exports = function (app, cb) {
  app.post('/testTwitter', function (req, res) {
    var tc = new TwitterClient();
    var options = {
      onlyWithHashtags: true,
      onlyWithCoordinates: true,
      boundingBoxLatSouth: 37.58,
      boundingBoxLatNorth: 42.92,
      boundingBoxLngWest: -91.71,
      boundingBoxLngEast: -80.54
    };
    try {
      tc.captureTweetsByLocation(options, function (err, twitterClient) {
        if (err) {
          res.status(200).end(err.toString());
        } else {
          res.status(200).end('TwitterClient started: ' + (new Date()).toISOString());
        }
/*        setTimeout(function () {
          twitterClient.destroy();
        }, 3000);*/
      });
    } catch (err) {
      res.status(200).end(err.toString());
    }
  });
  cb();
}

