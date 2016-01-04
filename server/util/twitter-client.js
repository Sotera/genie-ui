'use strict';
var log = require('debug')('util:twitter-client');
try {
  var Twitter = require('twitter');
  var async = require('async');
  var loopback = require('loopback');
  var LoopbackModelHelper = require('../util/loopback-model-helper');
  var ScoreBin = require('../util/twitter-score-bin');
  var apiCheck = require('api-check')({
    output: {
      prefix: 'compute_modules:clustered-event-source-helper',
      docsBaseUrl: 'http://www.example.com/error-docs#'
    },
    verbose: false
  });

  var twitterKeyFilename = require('path').join(__dirname, '../../.twitter-keys.json');
  var twitterKeys = JSON.parse(require('fs').readFileSync(twitterKeyFilename, 'utf8'));
  var inUseTwitterClients = [];
  var freeTwitterClients = twitterKeys.map(function (twitterKey) {
    return new Twitter(twitterKey);
  });

  var geoTweetHelper = new LoopbackModelHelper('GeoTweet');
  var scoredGeoTweetHelper = new LoopbackModelHelper('ScoredGeoTweet');

  module.exports = class {
    constructor() {
    }

    scoreNextGeoTweet(cb) {
      apiCheck.throw([apiCheck.func], arguments);
      var unscoredGeoTweetsQuery = {where: {scored: false}};
      async.waterfall(
        [
          function (cb) {
            geoTweetHelper.getModel().count(unscoredGeoTweetsQuery, function (err, count) {
              cb(err, count);
            });
          },
          function (count, cb) {
            geoTweetHelper.find({where: {scored: false}, limit: count}, function (err, geoTweets) {
              cb(err, geoTweets)
            });
          },
          function (geoTweets, cb) {
            var scoreRecords = [];
            geoTweets.forEach(function (geoTweet) {
              var scoreRecord = {};
              try {
                if (!geoTweet) {
                  throw new Error('<null> GeoTweet!');
                }
                var fullTweet = JSON.parse(geoTweet.fullTweet);
                //Now shall we score the tweet
                scoreRecord = {
                  id: fullTweet.id.toString(),
                  lat: fullTweet.genieLoc.lat,
                  lng: fullTweet.genieLoc.lng,
                  text: fullTweet.text,
                  username: fullTweet.user.screen_name,
                  tags: fullTweet.entities.hashtags.map(function (hashtag) {
                    return hashtag.text;
                  }),
                  dt: fullTweet.created_at,
                  cluster: -1
                };
                /*        geoTweet.updateAttribute('scored', false, function (err, tweet) {
                 cb(null);
                 });*/
                scoreRecords.push(scoreRecord);
              } catch (err) {
                log(err);
              }
            });
            cb(null, scoreRecords);
          },
          function (scoreRecords, cb) {
            var newRecords = {};
            scoreRecords.forEach(function (sr) {
              sr.tags.forEach(function (tag) {
                if (newRecords[tag]) {
                  newRecords[tag].push(sr);
                } else {
                  newRecords[tag] = [sr];
                }
              });
            });
            var blacklist = ['job', 'jobs', 'hiring', 'careerarc'];
            for (var tagText in newRecords) {
              if (blacklist.indexOf(tagText) != -1) {
                continue;
              }
              async.waterfall([
                  function (cb) {
                    scoredGeoTweetHelper.getModel().find({where: {tags: tagText}}, function (err, scoredGeoTweets) {
                      try {
                        if (err) {
                          log(err);
                          cb(null, 0);
                        }else{
                          cb(null, scoredGeoTweets.length);
                        }
                      } catch (err) {
                        cb(null, 0);
                      }
                    });
                  },
                  function (existingRecordCount, cb) {
                    var newRecord = newRecords[tagText];
                    var newRecordCount = newRecord.length;
                    var totalRecordCount = (newRecordCount + existingRecordCount);
                    if (totalRecordCount < 5) {
                      log('--> only' + totalRecordCount + ' entries (insufficient for clustering)')
                      var queries = newRecord.map(function (nr) {
                        return {where: {twitterId: nr.id}};
                      });
                      scoredGeoTweetHelper.findOrCreateMany(queries, newRecord, function (err, xx) {
                        var e = err;
                      });
                    }
                    cb(null);
                  }
                ],
                function (err, results) {
                  var e = err;
                });
              /*              var tweetMetaDataArray = newRecords[tagText];
               var len =tweetMetaDataArray.length;
               var scoreBin = new ScoreBin(tagText);*/
            }
            cb(null);
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

    captureTweetsByLocation(options, cb) {
      apiCheck.throw([apiCheck.shape({
        onlyWithHashtags: apiCheck.bool
        , onlyWithCoordinates: apiCheck.bool
        , boundingBoxLatSouth: apiCheck.number
        , boundingBoxLatNorth: apiCheck.number
        , boundingBoxLngWest: apiCheck.number
        , boundingBoxLngEast: apiCheck.number
      }), apiCheck.func], arguments);
      if (freeTwitterClients.length) {
        var self = this;
        var locations = options.boundingBoxLngWest.toString();
        locations += ',' + options.boundingBoxLatSouth.toString();
        locations += ',' + options.boundingBoxLngEast.toString();
        locations += ',' + options.boundingBoxLatNorth.toString();
        var twitterClientStreamOptions = {
          stall_warnings: true,
          locations
        };
        var twitterClient = null;
        inUseTwitterClients.push(twitterClient = freeTwitterClients.pop());
        twitterClient.stream('statuses/filter', twitterClientStreamOptions, function (stream) {
          stream.twitterClient = twitterClient;
          //MonkeyPatch stream.destroy to emit 'end' event
          var oldDestroy = stream.destroy;
          stream.destroy = function () {
            oldDestroy();
            stream.emit('end');
          }
          //Sign up for stream events we care about
          stream.on('data', function (tweet) {
            self.writeTweetToGeoTweetCollection(tweet, options);
          });
          stream.on('end', function () {
            var idxToRemove = inUseTwitterClients.indexOf(self.twitterClient);
            freeTwitterClients = freeTwitterClients.concat(inUseTwitterClients.splice(idxToRemove, 1));
          });
          stream.on('error', function (err) {
            log(err);
          });
          cb(null, stream);
        });
      } else {
        throw new Error('All TwitterClients in use!');
      }
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

