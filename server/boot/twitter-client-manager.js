'use strict';
var log = require('debug')('boot:twitter-client');
var TwitterClient = require('../util/twitter-client');
module.exports = function (app, cb) {
  app.get('/initializeGeoTweet', function (req, res) {
    res.status(200).end('Initialized GeoTweet');
  });

  app.post('/testTwitter2', function (req, res) {
    var tc = new TwitterClient();
    tc.scoreNextGeoTweet(function(err){
      restResponse(err, res);
    });
  });

  app.post('/testTwitter', function (req, res) {
    var tc = new TwitterClient();
    var options = {
      onlyWithHashtags: true,
      onlyWithCoordinates: true,
      /*      boundingBoxLatSouth: 37.58,
       boundingBoxLatNorth: 42.92,
       boundingBoxLngWest: -91.71,
       boundingBoxLngEast: -80.54,*/
      boundingBoxLatSouth: 20,
      boundingBoxLatNorth: 50,
      boundingBoxLngWest: -130,
      boundingBoxLngEast: -80,
      maxPlaceSizeMeters: 5000
    };
    try {
      tc.captureTweetsByLocation(options, function (err, twitterClient) {
        restResponse(err, res);
      });
    } catch (err) {
      res.status(200).end(err.toString());
    }
  });
  cb();
}

function restResponse(err, res){
  if (err) {
    res.status(200).end(err.toString());
  } else {
    res.status(200).end('SUCCESS: ' + (new Date()).toISOString());
  }
}
