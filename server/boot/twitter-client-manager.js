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
      var glob = require('glob-fs')({gitignore: true});
      const fileNames = glob.readdirSync('*.json', {cwd: folderName});
      fileNames.forEach(function (fileName) {
        var fileText = fs.readFileSync(path.join(folderName, fileName), 'utf8');
        var tweets = JSON.parse(fileText);
        tweets.forEach(function (tweet) {
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


  app.post('/stopTwitterScrape', function (req, res) {
    if (!twitterClient) {
      restResponse(new Error(twitterClientErrorMsg), res);
      return;
    }
    twitterClient.stopTwitterScraper(req.body, function(err){
      res.status(200).end((err || '').toString());
    });
  });

  app.post('/startTwitterScrape', function (req, res) {
    if (!twitterClient) {
      restResponse(new Error(twitterClientErrorMsg), res);
      return;
    }

    var boundingBoxLatSouth = req.body.coords[0];
    var boundingBoxLatNorth = req.body.coords[2];
    var boundingBoxLngWest = req.body.coords[1];
    var boundingBoxLngEast = req.body.coords[3];
    var options = {
      onlyWithHashtags: true,
      onlyWithCoordinates: true,
      boundingBoxLatSouth,
      boundingBoxLatNorth,
      boundingBoxLngWest,
      boundingBoxLngEast,
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
