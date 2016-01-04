'use strict';
var log = require('debug')('boot:twitter-client');
var TwitterClient = require('../util/twitter-client');
var twitterClient = null;
const twitterClientErrorMsg = 'Cannot create TwitterClient (Twitter key JSON file missing?)';
try {
  twitterClient = new TwitterClient();
} catch (err) {
  log(twitterClientErrorMsg);
}
module.exports = function (app, cb) {
  app.get('/initializeGeoTweet', function (req, res) {
    res.status(200).end('Initialized GeoTweet');
  });

  app.get('/loadTestTweetFile', function (req, res) {
    if (!twitterClient) {
      restResponse(new Error(twitterClientErrorMsg), res);
      return;
    }
    restResponse(null, res);
    try {
      const folderName = '/home/jreeme/src/hashTagClustering/raw_tweet_data/real-json/';
      var fs = require('fs');
      var path = require('path');
      const fileNames = [
        '2016-01-02_07:01:44.003319.real.json'
/*        ,'2016-01-02_06:55:36.713734.real.json'
        ,'2016-01-02_06:52:29.395153.real.json'
        ,'2016-01-02_06:58:40.889817.real.json'*/
      ];
      fileNames.forEach(function(fileName){
        var fileText = fs.readFileSync(path.join(folderName, fileName), 'utf8');
        var tweets = JSON.parse(fileText);
        tweets.forEach(function(tweet){
          twitterClient.writeTweetToGeoTweetCollection(tweet, {
            onlyWithCoordinates: true,
            onlyWithHashtags: true
          }, function (err, writtenTweet) {
            var t = writtenTweet;
          });
        });
      });
    } catch (err) {
      log(err);
    }
  });
  app.post('/testTwitter2', function (req, res) {
    if (!twitterClient) {
      restResponse(new Error(twitterClientErrorMsg), res);
      return;
    }
    twitterClient.scoreNextGeoTweet(function (err) {
      restResponse(err, res);
    });
  });

  app.post('/testTwitter', function (req, res) {
    if (!twitterClient) {
      restResponse(new Error(twitterClientErrorMsg), res);
      return;
    }
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
      twitterClient.captureTweetsByLocation(options, function (err, twitterClient) {
        restResponse(err, res);
      });
    } catch (err) {
      res.status(200).end(err.toString());
    }
  });
  cb();
}

function restResponse(err, res) {
  if (err) {
    res.status(200).end(err.toString());
  } else {
    res.status(200).end('SUCCESS: ' + (new Date()).toISOString());
  }
}
