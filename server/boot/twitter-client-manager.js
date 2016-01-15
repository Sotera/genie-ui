'use strict';
var log = require('debug')('boot:twitter-client');
var TwitterClient = require('../util/twitter-client');
var twitterClient = null;
const twitterClientErrorMsg = 'Cannot create TwitterClient (Twitter key JSON file missing?)';

module.exports = function (app, cb) {
  app.get('/initializeGeoTweet', function (req, res) {
    restResponse(null, res, 'Initialized GeoTweet');
  });

  app.get('/loadTestTweetFile', function (req, res) {
    checkTwitterClient(res, function (tc) {
      restResponse(null, res);
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
    });
  });

  //Beginnings of a mixin to expose class methods as rest endpoints
/*  console.log(Object.getOwnPropertyNames(Math).filter(function (p) {
    return typeof Math[p] === 'function';
  }));*/
  [
    'clusterScoredRecords'
    ,'stopTwitterScrape'
    ,'startTwitterScrape'
  ].forEach(function(twitterClientMethod){
    app.post('/' + twitterClientMethod, function (req, res) {
      callTwitterClientFn(req, res, twitterClientMethod);
    });
  });
  cb();
}

function callTwitterClientFn(req, res, fnName) {
  checkTwitterClient(res, function (tc) {
    var fn = tc[fnName];
    fn.bind(tc)(req.body, function (err, result) {
      restResponse(err, res, result);
    });
  });
}

function checkTwitterClient(res, cb) {
  if (!twitterClient) {
    try {
      twitterClient = new TwitterClient();
    } catch (err) {
      log(twitterClientErrorMsg);
      return;
    }
  }
  try {
    cb(twitterClient);
  } catch (err) {
    restResponse(err, res);
  }
}

function restResponse(err, res, result) {
  if (err) {
    res.status(200).end(err.toString());
  } else if (result) {
    var msg = (result instanceof Object) ? JSON.stringify(result) : result.toString();
    res.status(200).end(msg);
  } else {
    res.status(200).end('SUCCESS: ' + (new Date()).toISOString());
  }
}
