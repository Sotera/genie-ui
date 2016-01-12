'use strict';
var log = require('debug')('util:twitter-client');
try {
  var Twitter = require('twitter');
  var async = require('async');
  var moment = require('moment');
  var loopback = require('loopback');
  var clustering = require('density-clustering');
  var LoopbackModelHelper = require('../util/loopback-model-helper');
  var Random = require('random-js');
  var random = new Random(Random.engines.mt19937().seed(0xc01dbeef));
  var apiCheck = require('api-check')({
    output: {
      prefix: 'compute_modules:clustered-event-source-helper',
      docsBaseUrl: 'http://www.example.com/error-docs#'
    },
    verbose: false
  });

  var twitterKeyFilename = require('path').join(__dirname, '../../.twitter-keys.json');
  var twitterKeys = JSON.parse(require('fs').readFileSync(twitterKeyFilename, 'utf8'));
  var twitterKeyIdx = 0;
  var inUseTwitterStreams = {};

  var geoTweetHelper = new LoopbackModelHelper('GeoTweet');
  var geoTwitterScrape = new LoopbackModelHelper('GeoTwitterScrape');
  var scoredGeoTweetHelper = new LoopbackModelHelper('ScoredGeoTweet');

  //geoTwitterScrape.destroyAll();

  module.exports = class {
    constructor() {
    }

    scoreNextGeoTweet(cb) {
      apiCheck.throw([apiCheck.func], arguments);
      async.waterfall(
        [
          //Doing it all in memory for now. Later we may add ES query result paging, etc.
          //(but probably not)
          function (cb) {
            //Get number of GeoTweets so we can set an ES query limit. If we don't set one we'll
            //get 10 documents returned. Note that {where: {scored: false}} is ignored by the ES
            //Loopback data connector. 'count' will always return the total number of documents.

            //geoTweetHelper.count({where: {scored: false}}, function (err, count) {
            geoTweetHelper.count(function (err, count) {
              cb(err, count);
            });
          },
          function (count, cb) {
            //Retrieve all the unscored GeoTweets in one query (no paging)
            //geoTweetHelper.find({where: {scored: false}, limit: count}, function (err, geoTweets) {
            geoTweetHelper.find({limit: count}, function (err, geoTweets) {
              cb(err, geoTweets)
            });
          },
          function (geoTweets, cb) {
            //Map the fields from the full tweet object we need to do clustering and put them in a
            //nice array
            var scoreRecords = [];
            geoTweets.forEach(function (geoTweet) {
              var scoreGeoTweet = {};
              try {
                if (!geoTweet) {
                  throw new Error('<null> GeoTweet!');
                }
                var fullTweet = JSON.parse(geoTweet.fullTweet);
                //Now shall we score the tweet
                scoreGeoTweet = {
                  user: fullTweet.user.screen_name,
                  caption: fullTweet.text,
                  twitterId: fullTweet.id.toString(),
                  lat: fullTweet.genieLoc.lat,
                  lng: fullTweet.genieLoc.lng,
                  tags: fullTweet.entities.hashtags.map(function (hashtag) {
                    return hashtag.text;
                  }),
                  postDate: new Date(fullTweet.created_at),
                  indexedDate: new Date()
                };
                //Set GeoTweet instance to scored so we don't look at it again
                /*                geoTweet.updateAttribute('scored', true, function (err, o) {
                 var e = err;
                 });*/
                scoreRecords.push(scoreGeoTweet);
              } catch (err) {
                log(err);
              }
            });
            cb(null, scoreRecords);
          },
          function (scoreRecords, cb) {
            //Take the nice array of ScoredGeoTweets and slam them in to ES. Check twitterId so we don't
            //have any repeats (pretty unlikely but pretty easy to check so, why not?)
            var queries = scoreRecords.map(function (sr) {
              return {where: {twitterId: sr.id}};
            });
            scoredGeoTweetHelper.findOrCreateMany(queries, scoreRecords, function (err, newScoredRecords) {
              cb(null);
            });
          },
          function (cb) {
            scoredGeoTweetHelper.count(function (err, count) {
              cb(err, count);
            });
          },
          function (count, cb) {
            var refDate = new Date('2016-01-05T20:06:00.000Z');
            var filterStartDate = moment(refDate);
            var filterEndDate = moment(refDate);
            filterStartDate.subtract(2, 'minutes');
            scoredGeoTweetHelper.find({
                where: {
                  and: [
                    {postDate: {gt: filterStartDate}},
                    {postDate: {lt: filterEndDate}}
                  ]
                },
                limit: count
              },
              function (err, timeWindowedScoredGeoTweets) {
                /*              var minDate = new Date();
                 var maxDate = new Date('2000-01-01');
                 timeWindowedScoredGeoTweets.forEach(function (tweet) {
                 var postDate = new Date(tweet.postDate);
                 minDate = (postDate < minDate) ? postDate : minDate;
                 maxDate = (postDate > maxDate) ? postDate : maxDate;
                 });
                 var md = maxDate.toISOString();*/
                cb(null, timeWindowedScoredGeoTweets);
              });
          },
          function (timeWindowedScoredGeoTweets, cb) {
            const minTweetsToCluster = 5;
            var geoTweetBuckets = {};
            var blacklist = ['job', 'jobs', 'hiring', 'careerarc'];
            timeWindowedScoredGeoTweets.forEach(function (sr) {
              var tagArray = sr.tags.split(',');
              tagArray.forEach(function (tagText) {
                if (blacklist.indexOf(tagText) != -1) {
                  return;
                }
                if (geoTweetBuckets[tagText]) {
                  geoTweetBuckets[tagText].push(sr);
                } else {
                  geoTweetBuckets[tagText] = [sr];
                }
              });
            });
            cb();
          },
          function (geoTweetBuckets, cb) {
            for (var geoTweetBucket in geoTweetBuckets) {
              var geoTweetArray = geoTweetBuckets[geoTweetBucket];
              var dataToCluster = geoTweetArray.map(function (geoTweet) {
                return [geoTweet.lng, geoTweet.lat];
              });
              var dbscan = new clustering.DBSCAN();
              var clusters = dbscan.run(dataToCluster, 0.2, 3);
            }
            cb();
          }
        ],
        function (err, results) {
          var e = err;
        }
      );
    }

    writeTweetToGeoTweetCollection(tweet, options, cb) {
      try {
        options = options || {};
        cb = cb || function (err, createdGeoTweet) {
            if (err) {
              log(err);
              return;
            }
            log('Created GeoTweet: ');
            log(createdGeoTweet);
          }
        //Hashtags check is quicker so do it first
        if (options.onlyWithHashtags &&
          (!tweet.entities || !tweet.entities.hashtags || !tweet.entities.hashtags.length)) {
          log('No Hashtags');
          cb(null, null);
          return;
        }
        if (options.onlyWithCoordinates) {
          if (tweet.geo) {
            if (tweet.geo.type === 'Point') {
              if (tweet.geo.coordinates && tweet.geo.coordinates.length == 2) {
                tweet.genieLoc = {lng: tweet.geo.coordinates[1], lat: tweet.geo.coordinates[0]};
              }
            }
          }
          if (!tweet.genieLoc && tweet.coordinates) {
            tweet.genieLoc = {lng: tweet.coordinates[0], lat: tweet.coordinates[1]};
          }
          //Let's check the 'place' property
          if (!tweet.genieLoc && tweet.place && tweet.place.bounding_box && tweet.place.bounding_box.coordinates) {
            var coords = tweet.place.bounding_box.coordinates;
            if (coords instanceof Array) {
              if (coords.length == 1 && coords[0] instanceof Array) {
                var distanceInfo = this.diagonalDistanceOfBoundingBoxInMeters(coords[0]);
                if (distanceInfo.distanceMeters < options.maxPlaceSizeMeters) {
                  tweet.genieLoc = {lng: distanceInfo.center.lng, lat: distanceInfo.center.lat};
                }
              }
            }
          }
          if (!tweet.genieLoc) {
            cb(null, null);
            return;
          }
          log('We have coordinates! CenterPoint: [' + tweet.genieLoc.lng + ',' + tweet.genieLoc.lat + ']');
        }
        //Let's lowercase those hashtags (for string comparisons later)!
        if (tweet.entities && tweet.entities.hashtags) {
          for (var i = 0; i < tweet.entities.hashtags.length; ++i) {
            tweet.entities.hashtags[i].text = tweet.entities.hashtags[i].text.toLowerCase();
          }
        }
        //Save-o the Tweet-o!
        /*            geoTweetHelper.find(function(err,geoTweets){
         var gt = geoTweets;
         });*/
        /*            var connector = geoTweetHelper.getModel().getDataSource().connector;
         var cc = connector.getClientConfig();*/
        geoTweetHelper.create({
          location: tweet.genieLoc,
          scored: false,
          fullTweet: JSON.stringify(tweet)
        }, cb);
      } catch (err) {
        log(err);
      }
    }

    stopTwitterScraper(options, cb) {
      try {
        options = options || {};
        cb = cb || function (err, aa) {
            if (err) {
              log(err);
            }
          };
        var twitterStream = inUseTwitterStreams[options.scraperId.id];
        twitterStream.destroy();
        cb(null, null);
      } catch (err) {
        log(err);
      }
    }

    captureTweetsByLocation(options, cb) {
      apiCheck.throw([apiCheck.shape({
        onlyWithHashtags: apiCheck.bool
        , onlyWithCoordinates: apiCheck.bool
        , boundingBoxLatSouth: apiCheck.number
        , boundingBoxLatNorth: apiCheck.number
        , boundingBoxLngWest: apiCheck.number
        , boundingBoxLngEast: apiCheck.number
      }), apiCheck.func], arguments);
      var self = this;
      var locations = options.boundingBoxLngWest.toFixed(2);
      locations += ',' + options.boundingBoxLatSouth.toFixed(2);
      locations += ',' + options.boundingBoxLngEast.toFixed(2);
      locations += ',' + options.boundingBoxLatNorth.toFixed(2);
      var twitterClientStreamOptions = {
        stall_warnings: true,
        locations
      };
      var twitterClient = new Twitter(twitterKeys[++twitterKeyIdx % twitterKeys.length]);
      var scraperId = random.uuid4().toString().toLowerCase();
      twitterClient.stream('statuses/filter', twitterClientStreamOptions, function (stream) {
        inUseTwitterStreams[scraperId] = stream;
        stream.scraperId = scraperId;
        //Add record to GeoTwitterScrape to keep track of this scraper
        geoTwitterScrape.create({
          scraperId,
          scraperActive: true,
          timeStarted: new Date(),
          locations
        }, function (err, geoTwitterScraper) {
          //Sign up for stream events we care about
          stream.on('data', function (tweet) {
            var newTweetsExamined = (geoTwitterScraper.tweetsExamined || 0) + 1;
            geoTwitterScraper.updateAttribute('tweetsExamined', newTweetsExamined, function (err, o) {
              self.writeTweetToGeoTweetCollection(tweet, options);
            });
          });
          stream.on('end', function () {
            var scraperId = this.scraperId;
            geoTwitterScrape.findOne({where: {scraperId}}, function (err, geoTwitterScraper) {
              if(err){
                log(err);
                return;
              }
/*              geoTwitterScrape.destroyById(geoTwitterScraper.id, function(err){
                var e = err;
              });*/
            });
          });
          stream.on('error', function (err) {
            log(err);
          });
          cb(null, stream);
        });
      });
    }

    diagonalDistanceOfBoundingBoxInMeters(coords) {
      var minLng = Number.MAX_SAFE_INTEGER;
      var maxLng = Number.MIN_SAFE_INTEGER;
      var minLat = Number.MAX_SAFE_INTEGER;
      var maxLat = Number.MIN_SAFE_INTEGER;
      coords.forEach(function (coord) {
        minLng = coord[0] < minLng ? coord[0] : minLng;
        maxLng = coord[0] > maxLng ? coord[0] : maxLng;
        minLat = coord[1] < minLat ? coord[1] : minLat;
        maxLat = coord[1] > maxLat ? coord[1] : maxLat;
      });
      var loc0 = new loopback.GeoPoint({lat: minLat, lng: minLng});
      var loc1 = new loopback.GeoPoint({lat: maxLat, lng: maxLng});
      var distanceMeters = loopback.GeoPoint.distanceBetween(loc0, loc1, {type: 'meters'});
      return {distanceMeters, center: {lng: (maxLng + minLng) / 2, lat: (maxLat + minLat) / 2}};
    }
  }
} catch (err) {
  log(err);
}

