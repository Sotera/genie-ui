'use strict';
var log = require('debug')('compute_modules:twitter-hashtag-clusterer');
var Twitter = require('twitter');
var async = require('async');
var moment = require('moment');
var loopback = require('loopback');
var clustering = require('density-clustering');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var ScoreRecord = require('../compute_modules/geo-tweet-score-record');
var Random = require('random-js');
var random = new Random(Random.engines.mt19937().seed(0xc01dbeef));
var ensureStringArray = require('../util/ensure-string-array');

var twitterKeyFilename = require('path').join(__dirname, '../../.twitter-keys.json');
var twitterKeys = JSON.parse(require('fs').readFileSync(twitterKeyFilename, 'utf8'));
var twitterKeyIdx = 0;
var inUseTwitterStreams = {};


module.exports = class {
  constructor(app) {
    this.app = app;
    this.geoTweetHelper = new LoopbackModelHelper('GeoTweet');
    this.geoTwitterScrape = new LoopbackModelHelper('GeoTwitterScrape');
    this.scoredGeoTweetHelper = new LoopbackModelHelper('ScoredGeoTweet');
  }

  post_clusterScoredRecords(options, cb) {
    options = options || {};
    apiCheck.throw([apiCheck.object, apiCheck.func], arguments);
    async.waterfall(
      [
        function getScoredRecordCount(cb) {
          scoredGeoTweetHelper.count(function (err, count) {
            cb(err, count);
          });
        },
        function getClusterTimeWindow(count, cb) {
          try {
            options.count = count;
            options.blackList = options.blackList || [];
            options.dbscanEpsilonMeters = options.dbscanEpsilonMeters || 500;
            options.dbscanMinMembersInCluster = options.dbscanMinMembersInCluster || 5;
            //See if caller provided us an end date
            /*              options.startDate = '2016-01-04T20:06:00.000Z';
             options.endDate = '2016-01-05T20:06:00.000Z';
             options.clusteringWindowMinutes = 4 * 60;*/
            options.minTweetsToCluster = options.minTweetsToCluster || 5;
            options.minTweetsToCluster = (options.minTweetsToCluster < 3)
              ? 3
              : (options.minTweetsToCluster > 10)
              ? 10
              : options.minTweetsToCluster;
            options._filterClusteringWindowMinutes = options.clusteringWindowMinutes || 8 * 60;
            options._filterClusteringWindowMinutes = (options._filterClusteringWindowMinutes < 60)
              ? 60
              : (options._filterClusteringWindowMinutes > (8 * 60))
              ? (8 * 60)
              : options._filterClusteringWindowMinutes;

            options._filterStartDate = (isNaN(Date.parse(options.startDate)))
              ? null
              : moment(Date.parse(options.startDate));

            options._filterEndDate = (isNaN(Date.parse(options.endDate)))
              ? null
              : moment(Date.parse(options.endDate));
          } catch (err) {
            options._filterStartDate = options._filterEndDate = null;
          }
          //If we can't get enough info from user about clustering time window then get latest
          //date from data and go back _filterClusteringWindowMinutes to create window
          if (options._filterStartDate && options._filterEndDate) {
            cb(null, options);
          } else if (!options._filterStartDate && !options._filterEndDate) {
            scoredGeoTweetHelper.find(
              function (err, timeWindowedScoredGeoTweets) {
                var minDate = new Date();
                var maxDate = new Date('1900-01-01');
                timeWindowedScoredGeoTweets.forEach(function (tweet) {
                  var postDate = new Date(tweet.postDate);
                  minDate = (postDate < minDate) ? postDate : minDate;
                  maxDate = (postDate > maxDate) ? postDate : maxDate;
                });
                options._filterEndDate = moment(maxDate);
                options._filterStartDate = moment(maxDate);
                options._filterStartDate.subtract(options._filterClusteringWindowMinutes, 'minutes');
                cb(null, options);
              }
            );
          } else if (options._filterStartDate) {
            options._filterEndDate = moment(options._filterStartDate);
            options._filterEndDate.add(options._filterClusteringWindowMinutes, 'minutes');
            cb(null, options);
          } else if (options._filterEndDate) {
            options._filterStartDate = moment(options._filterEndDate);
            options._filterEndDate.subtract(options._filterClusteringWindowMinutes, 'minutes');
            cb(null, options);
          }
        },
        function (options, cb) {
          scoredGeoTweetHelper.find({
              where: {
                and: [
                  {postDate: {gte: options._filterStartDate}},
                  {postDate: {lte: options._filterEndDate}}
                ]
              },
              limit: options.count
            },
            function (err, timeWindowedScoredGeoTweets) {
              cb(null, options, timeWindowedScoredGeoTweets);
            });
        },
        function (options, timeWindowedScoredGeoTweets, cb) {
          var geoTweetBuckets = {};
          timeWindowedScoredGeoTweets.forEach(function (sr) {
            var tagArray = sr.tags.split(',');
            tagArray.forEach(function (tagText) {
              if (options.blackList.indexOf(tagText) != -1) {
                return;
              }
              if (geoTweetBuckets[tagText]) {
                geoTweetBuckets[tagText].push(sr);
              } else {
                geoTweetBuckets[tagText] = [sr];
              }
            });
          });
          cb(null, options, geoTweetBuckets);
        },
        function (options, geoTweetBuckets, cb) {
          var loc0 = new loopback.GeoPoint({lat: 0, lng: 0});
          var loc1 = new loopback.GeoPoint({lat: 0, lng: 0});
          for (var geoTweetBucket in geoTweetBuckets) {
            var geoTweetArray = geoTweetBuckets[geoTweetBucket];
            var dataToCluster = geoTweetArray.map(function (geoTweet) {
              return [geoTweet.lng, geoTweet.lat];
            });
            var dbscan = new clustering.DBSCAN();
            geoTweetArray.clusters = dbscan.run(
              dataToCluster,
              options.dbscanEpsilonMeters,
              options.dbscanMinMembersInCluster,
              function (p, q) {
                if (p.length != 2 || q.length != 2) {
                  return Number.MAX_VALUE;
                }
                //Quick look to exclude very far away
                /*                p = [-97,30.99];
                 q = [-96.99,31];*/
                var quickDist = (((p[1] - q[1]) * (p[1] - q[1])) + ((p[0] - q[0]) * (p[0] - q[0])));
                if (quickDist > 0.001) {
                  return Number.MAX_VALUE;
                }
                loc0.lat = p[1];
                loc0.lng = p[0];
                loc1.lat = q[1];
                loc1.lng = q[0];
                var distanceMeters = loopback.GeoPoint.distanceBetween(loc0, loc1, {type: 'meters'});
                return distanceMeters;
              });
          }
          cb(null, options, geoTweetBuckets);
        },
        function (options, geoTweetBuckets, cb) {
          for (var geoTweetBucket in geoTweetBuckets) {
            var geoTweetArray = geoTweetBuckets[geoTweetBucket];
            geoTweetArray = geoTweetBuckets[geoTweetBucket];
          }
          cb();
        }
      ],
      function (err, results) {
        var e = err;
      });
  }

  post_processNewTweets(options, cb) {
    options = options || {};
    apiCheck.throw([apiCheck.object, apiCheck.func], arguments);
    async.waterfall(
      [
        //Doing it all in memory for now. Later we may add ES query result paging, etc.
        //(but probably not)
        function getGeoTweetCount(cb) {
          //Get number of GeoTweets so we can set an ES query limit. If we don't set one we'll
          //get 10 documents returned. Note that {where: {scored: false}} is ignored by the ES
          //Loopback data connector. 'count' will always return the total number of documents.

          //geoTweetHelper.count({where: {scored: false}}, function (err, count) {
          geoTweetHelper.count(function (err, count) {
            cb(err, count);
          });
        },
        function getGeoTweets(count, cb) {
          //Retrieve all the unscored GeoTweets in one query (no paging)
          //geoTweetHelper.find({where: {scored: false}, limit: count}, function (err, geoTweets) {
          geoTweetHelper.find({limit: count}, function (err, geoTweets) {
            cb(err, geoTweets)
          });
        },
        function convertGeoTweetsToScoreRecords(geoTweets, cb) {
          //Map the fields from the full tweet object we need to do clustering and put them in a
          //nice array
          var scoreRecords = [];
          geoTweets.forEach(function (geoTweet) {
            try {
              if (!geoTweet) {
                throw new Error('<null> GeoTweet!');
              }
              var fullTweet = JSON.parse(geoTweet.full_tweet);
              //Now shall we score the tweet
              //Set GeoTweet instance to scored so we don't look at it again
              /*                geoTweet.updateAttribute('scored', true, function (err, o) {
               var e = err;
               });*/
              var scoreRecord = new ScoreRecord(full_tweet);
              scoreRecords.push(scoreRecord);
            } catch (err) {
              log(err);
            }
          });
          cb(null, scoreRecords);
        },
        function putScoreRecordsIntoDatabase(scoreRecords, cb) {
          //Take the nice array of ScoredGeoTweets and slam them in to ES. Check twitterId so we don't
          //have any repeats (pretty unlikely but pretty easy to check so, why not?)
          var queries = scoreRecords.map(function (sr) {
            return {where: {twitterId: sr.id}};
          });
          scoredGeoTweetHelper.findOrCreateMany(queries, scoreRecords, function (err, newScoredRecords) {
            cb(null);
          });
        }
      ],
      function (err, results) {
        var e = err;
      }
    );
  }

  post_convertTweetToGeoTweet(options, cb) {
    try {
      var tweet = options.tweet;
      //Hashtags check is quicker so do it first
      if (options.onlyWithHashtags &&
        (!tweet.entities || !tweet.entities.hashtags || !tweet.entities.hashtags.length)) {
        log('No Hashtags');
        cb(null, null);
        return;
      }
      if (options.onlyWithLocation) {
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
        /*          if (!tweet.genieLoc && tweet.place && tweet.place.bounding_box && tweet.place.bounding_box.coordinates) {
         var coords = tweet.place.bounding_box.coordinates;
         if (coords instanceof Array) {
         if (coords.length == 1 && coords[0] instanceof Array) {
         var distanceInfo = this._diagonalDistanceOfBoundingBoxInMeters(coords[0]);
         if (distanceInfo.distanceMeters < options.maxPlaceSizeMeters) {
         tweet.genieLoc = {lng: distanceInfo.center.lng, lat: distanceInfo.center.lat};
         }
         }
         }
         }*/
        if (!tweet.genieLoc) {
          cb(null, null);
          return;
        }
        //log('We have coordinates! CenterPoint: [' + tweet.genieLoc.lng + ',' + tweet.genieLoc.lat + ']');
      }
      //Let's lowercase those hashtags (for string comparisons later)!
      if (tweet.entities && tweet.entities.hashtags) {
        for (var i = 0; i < tweet.entities.hashtags.length; ++i) {
          tweet.entities.hashtags[i].text = tweet.entities.hashtags[i].text.toLowerCase();
        }
      }
      cb(null,
        {
          lat: tweet.genieLoc.lat,
          lng: tweet.genieLoc.lng,
          scored: false,
          tweet_id: tweet.id_str,
          full_tweet: JSON.stringify(tweet)
        });
    } catch (err) {
      log(err);
      cb(err);
    }
  }

  post_stopTwitterScrape(options, cb) {
    try {
      options = options || {};
      cb = cb || function (err) {
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

  post_startTwitterScrape(options, cb) {
    var self = this;
    var locations = options.boundingBox.lngWest.toFixed(4);
    locations += ',' + options.boundingBox.latSouth.toFixed(4);
    locations += ',' + options.boundingBox.lngEast.toFixed(4);
    locations += ',' + options.boundingBox.latNorth.toFixed(4);
    var twitterClientStreamOptions = {
      stall_warnings: true,
      locations
    };
    var twitterClient = new Twitter(twitterKeys[++twitterKeyIdx % twitterKeys.length]);
    var scraperId = random.uuid4().toString().toLowerCase();
    try {
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
          if (err) {
            cb(err);
            return;
          }
          cb(err, geoTwitterScraper);
          //Sign up for stream events we care about
          stream.on('data', function (tweet) {
            var newTweetsExamined = (geoTwitterScraper.tweetsExamined || 0) + 1;
            geoTwitterScraper.updateAttribute('tweetsExamined', newTweetsExamined, function (err, o) {
              options.tweet = tweet;
              self.post_convertTweetToGeoTweet(options);
            });
          });
          stream.on('end', function () {
            var scraperId = this.scraperId;
            geoTwitterScrape.findOne({where: {scraperId}}, function (err, geoTwitterScraper) {
              if (err) {
                log(err);
                return;
              }
            });
          });
          stream.on('error', function (err) {
            log(err);
          });
        });
      });
    } catch (err) {
      log(err);
    }
  }

  post_restTranslateFileToGeoTweet(options, cb) {
    var path = options.path;
    var JSONStream = require('JSONStream');
    var es = require('event-stream');
    var fs = require('fs');
    var self = this;
    fs.createReadStream(path, 'utf8')
      .pipe(JSONStream.parse('*'))
      .pipe(es.map(function (tweet, cb) {
        self.post_convertTweetToGeoTweet({
          tweet,
          onlyWithLocation: true,
          onlyWithHashtags: true
        }, function (err, geoTweet) {
          cb(err, geoTweet);
        });
      }))
      .on('data', function (geoTweet) {
        self.geoTweetHelper.findOrCreateEnqueue({where: {tweet_id: geoTweet.tweet_id}}, geoTweet);
      })
      .on('end', function () {
        self.geoTweetHelper.flushQueues(function (err, results) {
          if (err) {
            log(err);
          }
          cb(err, results);
        });
      });
  }

  post_translateFileToGeoTweet(options, cb) {
    var request = require('request');
    var host = this.app.get('host');
    var port = this.app.get('port');

    request.post({
      url: 'http://' + host + ':' + port + '/TwitterHashtagClusterer/restTranslateFileToGeoTweet',
      json: true,
      body: options
    }, function (err, response, body) {
      cb(err, body);
    });
  }

  post_loadTestTweetFiles(options, cb) {
    var foldersToSearch = ensureStringArray(options.foldersToSearch);
    var globExpression = options.globExpression || '*';
    var glob = require('glob-fs')({gitignore: true});
    var self = this;
    var taskQueue = async.queue(self.translateFileToGeoTweet.bind(self), 8);
    foldersToSearch.forEach(function (folderToSearch) {
      //In the spirit of scalability let's stream the globbed filenames
      var fileCount = 0;
      glob.readdirStream(globExpression, {cwd: folderToSearch})
        .on('data', function (file) {
          log('Queuing: ' + file.name + '[' + (++fileCount) + ']');
          process.nextTick(()=> {
            taskQueue.push({path: file.path}, function (err) {
              if (err) {
                log(err);
                return;
              }
              log('Processed: ' + file.name);
            });
          });
        })
        .on('error', function (err) {
          log(err);
          cb(err, {fileCount});
        })
        .on('end', function () {
          cb(null, {fileCount});
        });
    });
  }

  _diagonalDistanceOfBoundingBoxInMeters(coords) {
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

