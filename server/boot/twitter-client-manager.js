'use strict';
var log = require('debug')('boot:twitter-client');
var TwitterClient = require('../util/twitter-client');
var RestResponseHelper = require('../util/rest-response-helper');
var twitterClient = null;
const twitterClientErrorMsg = 'Cannot create TwitterClient (Twitter key JSON file missing?)';
const restResponseHelper = new RestResponseHelper();

module.exports = function (app, cb) {
  app.get('/initializeGeoTweet', function (req, res) {
    restResponseHelper.respond(null, res, 'Initialized GeoTweet');
  });

  app.get('/loadTestTweetFile', function (req, res) {
    checkTwitterClient(res, function (tc) {
      restResponseHelper.respond(null, res);
      const folderName = '/home/jreeme/src/hashTagClustering/raw_tweet_data/real-json/';
      var fs = require('fs');
      var path = require('path');
      var glob = require('glob-fs')({gitignore: true});
      const fileNames = glob.readdirSync('*12-02*.json', {cwd: folderName});
      fileNames.forEach(function (fileName) {
        var fileText = fs.readFileSync(path.join(folderName, fileName), 'utf8');
        var tweets = JSON.parse(fileText);
        tweets.forEach(function (tweet) {
          if (!tweet) {
            return;
          }
          twitterClient.writeTweetToGeoTweetCollection(tweet, {
            onlyWithLocation: true,
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
    , 'processNewTweets'
    , 'stopTwitterScrape'
    , 'startTwitterScrape'
  ].forEach(function (twitterClientMethod) {
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
      restResponseHelper.respond(err, res, result);
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
    restResponseHelper.respond(err, res);
  }
}
