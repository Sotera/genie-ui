'use strict';
var log = require('debug')('compute_modules:twitter-hashtag-clusterer');
var now = require('performance-now');
var Twitter = require('twitter');
var async = require('async');
var request = require('request');
var moment = require('moment');
var loopback = require('loopback');
var clustering = require('density-clustering');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var Random = require('random-js');
var ensureStringArray = require('../util/ensure-string-array');

var twitterKeyFilename = require('path').join(__dirname, '../../.twitter-keys.json');
var twitterKeys = JSON.parse(require('fs').readFileSync(twitterKeyFilename, 'utf8'));
var twitterKeyIdx = 0;
var inUseTwitterStreams = {};

const random = new Random(Random.engines.mt19937().autoSeed());
const dbscan = new clustering.DBSCAN();

module.exports = class {
  constructor(app) {
    this.app = app;
    this.hashtagBlacklist = [];
    this.geoTweetHelper = new LoopbackModelHelper('GeoTweet');
    this.geoTwitterScrapeHelper = new LoopbackModelHelper('GeoTwitterScrape');
    this.scoredGeoTweetHelper = new LoopbackModelHelper('ScoredGeoTweet');
    this.geoTweetHashtagIndexHelper = new LoopbackModelHelper('GeoTweetHashtagIndex');
    this.hashtagEventsSourceHelper = new LoopbackModelHelper('HashtagEventsSource');
    this.restCallTaskQueues = {
      apiName: 'TwitterHashtagClusterer'
    }
  }

  post_clusterHashtags(options, cb) {
    const millisecondsToMinutes = 1 / (60 * 1000);
    options = options || {};
    var minTweetCount = options.minTweetCount || 2;
    var minUniqueUsers = options.minUniqueUsers || 3;
    var dbscanTimeEpsilonMinutes = options.dbscanTimeEpsilonMinutes || 60;
    var dbscanTimeMinMembersInCluster = options.dbscanTimeMinMembersInCluster || 5;
    var dbscanGeoEpsilonMeters = options.dbscanGeoEpsilonMeters || 2000;
    var dbscanGeoMinMembersInCluster = options.dbscanGeoMinMembersInCluster || 5;

    var self = this;
    async.waterfall(
      [
        function getHashtagIndexWithEnoughTweets(cb) {
          self.geoTweetHashtagIndexHelper.find({where: {geo_tweet_id_count: {gt: minTweetCount}}}, function (err, hashtagIndices) {
            cb(null, hashtagIndices);
          });
        },
        function clusterHashtagIndicesToTimeClusters(hashtagIndices, cb) {
          async.mapSeries(hashtagIndices,
            function (hashtagIndex, cb) {
              var geo_tweet_ids = hashtagIndex.geo_tweet_ids;
              self.geoTweetHelper.find({
                where: {tweet_id: {inq: geo_tweet_ids}},
                fields: {post_date: true, username: true, tweet_id: true, lat: true, lng: true}
              }, function (err, geoTweets) {
                var timeDataToCluster = geoTweets.map(function (geoTweet) {
                  return [geoTweet.post_date.valueOf() * millisecondsToMinutes, 0];
                });
                var timeClusters = dbscan.run(
                  timeDataToCluster,
                  dbscanTimeEpsilonMinutes,
                  dbscanTimeMinMembersInCluster,
                  function (p, q) {
                    return Math.abs(p[0] - q[0]);
                  });
                var timeGeoTweetClusters = [];
                timeClusters.forEach(function (timeCluster) {
                  timeGeoTweetClusters.push({
                    hashtag: hashtagIndex.hashtag,
                    geoTweets: timeCluster.map(function (tweetIdx) {
                      return geoTweets[tweetIdx];
                    })
                  })
                  ;
                });
                cb(null, timeGeoTweetClusters);
              });
            },
            function (err, results) {
              var timeClusters = [];
              results.forEach(function (result) {
                result.forEach(function (timeCluster) {
                  timeClusters.push(timeCluster);
                })
              })
              cb(err, timeClusters);
            });
        },
        function clusterTimeClustersToGeoClusters(timeClusters, cb) {
          var loc0 = new loopback.GeoPoint({lat: 0, lng: 0});
          var loc1 = new loopback.GeoPoint({lat: 0, lng: 0});
          var eventSourceClusters = [];
          //Use empirical constant 1.1e-5 to quickly filter large distances
          var sqrtQuickDistanceExclude = (dbscanGeoEpsilonMeters) * 1.1e-5;
          var quickDistanceExclude = 1.1 * (sqrtQuickDistanceExclude * sqrtQuickDistanceExclude);
          timeClusters.forEach(function (timeCluster) {
            var geoDataToCluster = timeCluster.geoTweets.map(function (geoTweet) {
              return [geoTweet.lng, geoTweet.lat];
            });
            var geoClusters = dbscan.run(
              geoDataToCluster,
              dbscanGeoEpsilonMeters,
              dbscanGeoMinMembersInCluster,
              function (p, q) {
                if (p.length != 2 || q.length != 2) {
                  return Number.MAX_VALUE;
                }
                //Quick look to exclude very far away
                var delX = (p[1] - q[1]);
                var delY = (p[0] - q[0]);
                var quickDist = ((delY * delY) + (delX * delX));
                if (quickDist > quickDistanceExclude) {
                  return Number.MAX_VALUE;
                }
                loc0.lat = p[1];
                loc0.lng = p[0];
                loc1.lat = q[1];
                loc1.lng = q[0];
                //Use great circle distance for more accuracy
                var distanceMeters = loopback.GeoPoint.distanceBetween(loc0, loc1, {type: 'meters'});
                return distanceMeters;
              });
            if (!geoClusters.length) {
              return;
            }
            var clustersOfTweets = [];
            geoClusters.forEach(function (geoCluster) {
              clustersOfTweets.push(geoCluster.map(function (idx) {
                return timeCluster.geoTweets[idx];
              }));
            });
            eventSourceClusters.push({hashtag: timeCluster.hashtag, clustersOfTweets})
          });
          cb(null, eventSourceClusters);
        },
        function cullTweetClustersWithoutEnoughUniqueUsers(eventSourceClusters, cb) {
          eventSourceClusters.forEach(function (eventSourceCluster) {
            eventSourceCluster.clustersOfTweets =
              eventSourceCluster.clustersOfTweets.filter(function (clusterOfTweets) {
                var userSet = {};
                clusterOfTweets.forEach(function (tweet) {
                  //We may want to know number of tweets per user later
                  if (!userSet[tweet.username]) {
                    userSet[tweet.username] = 0;
                  }
                  ++userSet[tweet.username];
                });
                var uniqueUserCount = Object.keys(userSet).length;
                var retVal = (uniqueUserCount >= minUniqueUsers);
                if (retVal) {
                  clusterOfTweets.uniqueUserCount = uniqueUserCount;
                }
                return retVal;
              });
          });
          //Filter our eventSourceClusters with no clusters of tweets
          cb(null, eventSourceClusters.filter(function (eventSourceCluster) {
            return eventSourceCluster.clustersOfTweets.length != 0;
          }));
        },
        function updateHashtagEventSourceCollection(eventSourceClusters, cb) {
          eventSourceClusters.forEach(function (eventSourceCluster) {
            var hashtag = eventSourceCluster.hashtag;
            eventSourceCluster.clustersOfTweets.forEach(function (clusterOfTweets) {
              var numPosts = clusterOfTweets.length;
              var reduceResult = clusterOfTweets.reduce(function (prev, curr, idx) {
                return {
                  lat: prev.lat + curr.lat,
                  lng: prev.lng + curr.lng,
                  post_date: prev.post_date + curr.post_date.getTime()
                };
              }, {lat: 0, lng: 0, post_date: 0});
              var lat = reduceResult.lat / numPosts;
              var lng = reduceResult.lng / numPosts;
              var post_date = reduceResult.post_date / numPosts;
              //Construct EventsSource object to write to collection
              var newHashtagEventsSource = {
                event_id: random.uuid4().toString(),
                unique_user_count: clusterOfTweets.uniqueUserCount,
                num_posts: numPosts,
                event_source: 'hashtag',
                post_date: new Date(post_date),
                indexed_date: new Date(),
                hashtag,
                lat,
                lng
              };
              self.hashtagEventsSourceHelper.create(newHashtagEventsSource, function (err, result) {
                var r = result;
              });
            });
          });
          cb(null);
        }
      ],
      function (err, results) {
        cb(err, {msg: 'Finished Clustering'});
      }
    );
  }

  post_getSomeUnprocessedGeoTweets(options, cb) {
    var self = this;
    var limit = options.limit || 32;
    //var skip = options.skip || 0;

    self.geoTweetHelper.count({hashtag_indexed: false}, function (err, count) {
      var remaining = count - limit;
      var query = {
        where: {
          hashtag_indexed: false
        },
        fields: {
          hashtags: true,
          tweet_id: true
        },
        limit
        //,skip
      };
      self.geoTweetHelper.find(query, function (err, geoTweets) {
        cb(err, {geoTweets, limit, remaining});
      });
    });
  }

  post_createTweetsByHashtagAndMarkGeoTweetAsIndexed(options, cb) {
    var self = this;
    var geoTweets = options.geoTweets;
    var hashtagBlacklist = options.hashtagBlacklist;
    var tweetsByHashtag = {};
    geoTweets.forEach(function (geoTweet) {
      var tweet_id = geoTweet.tweet_id;
      self.geoTweetHelper.updateAll(
        {tweet_id},
        {hashtag_indexed: true},
        (err)=> {
          if (err) {
            log(err);
          }
        });
      geoTweet.hashtags.forEach(function (hashtag) {
        if (hashtagBlacklist.indexOf(hashtag) !== -1) {
          return;
        }
        if (!tweetsByHashtag[hashtag]) {
          tweetsByHashtag[hashtag] = {};
        }
        if (!tweetsByHashtag[hashtag][tweet_id]) {
          tweetsByHashtag[hashtag][tweet_id] = null;
        }
      });
    });
    var tweetsByHashtagArray = [];
    for (var hashtag in tweetsByHashtag) {
      var tweetIds = [];
      for (var tweetId in tweetsByHashtag[hashtag]) {
        tweetIds.push(tweetId);
      }
      tweetsByHashtagArray.push({
        hashtag,
        geo_tweet_ids: tweetIds,
        geo_tweet_id_count: tweetIds.length
      });
    }
    cb(null, {tweetsByHashtag, tweetsByHashtagArray});
  }

  post_findOrCreateHashtagIndices(options, cb) {
    var self = this;
    var tweetsByHashtagArray = options.tweetsByHashtagArray;
    var tweetsByHashtag = options.tweetsByHashtag;
    var queries = tweetsByHashtagArray.map(function (x) {
      return {where: {hashtag: x.hashtag}};
    });
    self.geoTweetHashtagIndexHelper.findOrCreateMany(queries, tweetsByHashtagArray, function (err, createResults) {
      cb(null, {createResults, tweetsByHashtag});
    });
  }

  post_updateHashtagIndex(options, cb) {
    var self = this;
    var tweetIds = options.tweetIds;
    var tweetsByHashtagArray = options.tweetsByHashtagArray;
    async.each(tweetIds,
      function (tweetId, cb) {
        if(tweetsByHashtagArray.geo_tweet_ids.indexOf(tweetId) !== -1){
          cb(null);
          return;
        }
        var geo_tweet_ids = [];
        tweetsByHashtagArray.geo_tweet_ids.forEach(function (geo_tweet_id) {
          geo_tweet_ids.push(geo_tweet_id);
        });
        if (geo_tweet_ids.length > 100) {
          var hashtag = tweetsByHashtagArray.hashtag;
          if (self.hashtagBlacklist.indexOf(hashtag) === -1) {
            self.hashtagBlacklist.push(hashtag);
            self.geoTweetHashtagIndexHelper.destroyAll({hashtag}, (err, result)=> {
              log('Adding ' + hashtag + ' to blacklist');
            });
          }
        }
        //add tweet_id to this hashtags tweet_id array and update collection
        geo_tweet_ids.push(tweetId);
        self.geoTweetHashtagIndexHelper.updateAll({
            hashtag: tweetsByHashtagArray.hashtag
          }, {
            geo_tweet_ids
            , geo_tweet_id_count: geo_tweet_ids.length
          },
          function (err, results) {
            if (err) {
              log(err);
            }
            cb(null);
          }
        );
      },
      function (err) {
        cb(null);
      });
  }

  post_indexGeoTweetsByHashtag(options, cb) {
    var self = this;
    var limit = options.limit || 200;
    var remaining = 0;
    async.waterfall(
      [
        function (cb) {
          self._callViaPost('getSomeUnprocessedGeoTweets',
            {
              limit
            }, function (err, getGeoTweetsResults) {
              limit = getGeoTweetsResults.limit;
              remaining = getGeoTweetsResults.remaining;
              cb(err, getGeoTweetsResults.geoTweets);
            });
        },
        function (geoTweets, cb) {
          self._callViaPost('createTweetsByHashtagAndMarkGeoTweetAsIndexed',
            {
              geoTweets,
              hashtagBlacklist: self.hashtagBlacklist
            }, function (err, createResults) {
              cb(err, createResults);
            });
        },
        function (createResults, cb) {
          self._callViaPost('findOrCreateHashtagIndices',
            {
              tweetsByHashtag: createResults.tweetsByHashtag,
              tweetsByHashtagArray: createResults.tweetsByHashtagArray
            },
            function (err, results) {
              cb(err, results);
            }
          );
        },
        function (results, cb) {
          var createResults = results.createResults;
          var tweetsByHashtag = results.tweetsByHashtag;
          async.each(createResults,
            function (createResult, cb) {
              var tweetsByHashtagArray = createResult[0];
              var hashtagIndexWasCreated = createResult[1];
              if (hashtagIndexWasCreated) {
                //record was created and not found
                cb(null);
                return;
              }
              //record was found and must be updated with new twitter ids
              var tweetIds = [];
              for (var tweetId in tweetsByHashtag[tweetsByHashtagArray.hashtag]) {
                tweetIds.push(tweetId);
              }
              self._callViaPost('updateHashtagIndex',
                {
                  tweetIds
                  , tweetsByHashtagArray
                }, function (err, updateResults) {
                  cb(err, updateResults);
                });
            },
            function (err) {
              cb(null, results);
            });
        }
      ], function (err, results) {
        cb(err, {
          msg: 'Indexed GeoTweets',
          limit,
          remaining
        });
      });
  }

  post_convertTweetToGeoTweet(options, cb) {
    try {
      var tweet = options.tweet;
      var geo = tweet.geo;
      //Hashtags check is quicker so do it first
      if (!(tweet.entities && tweet.entities.hashtags && tweet.entities.hashtags.length)) {
        log('No Hashtags');
        cb();
        return;
      }
      if (geo) {
        if (geo.type === 'Point') {
          if (geo.coordinates && geo.coordinates.length == 2) {
            tweet.genieLoc = {lng: geo.coordinates[1], lat: geo.coordinates[0]};
          }
        }
      }
      if (!tweet.genieLoc && tweet.coordinates) {
        tweet.genieLoc = {lng: tweet.coordinates[0], lat: tweet.coordinates[1]};
      }
      // TODO: what to do when tweet has place.bounding_box.coordinates (polygon)?

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
        cb();
        return;
      } else {
        log(tweet);
      }
      //log('We have coordinates! CenterPoint: [' + tweet.genieLoc.lng + ',' + tweet.genieLoc.lat + ']');
      //Let's lowercase those hashtags (for string comparisons later)!
      var hashtags = [];
      for (var i = 0; i < tweet.entities.hashtags.length; ++i) {
        var ht = tweet.entities.hashtags;
        hashtags.push(ht[i].text = ht[i].text.toLowerCase());
      }
      cb(null,
        {
          lat: tweet.genieLoc.lat
          , lng: tweet.genieLoc.lng
          , post_date: new Date(tweet.created_at)
          , tweet_id: tweet.id_str
          , username: tweet.user.screen_name
          , full_tweet: JSON.stringify(tweet)
          , hashtags
        });
    } catch (err) {
      log(err);
      cb(err);
    }
  }

  post_translateFileToGeoTweet(options, cb) {
    var path = options.path;
    var JSONStream = require('JSONStream');
    var es = require('event-stream');
    var fs = require('fs');
    var self = this;
    fs.createReadStream(path, 'utf8')
      .pipe(JSONStream.parse('*'))
      .pipe(es.map(function (tweet, cb) {
        self._callViaPost('convertTweetToGeoTweet',
          {
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
          if (results) {
            log('Wrote: ' + results.length + ' GeoTweets');
          }
          cb(err, results);
        });
      });
  }

  post_loadTestTweetFiles(options, cb) {
    var foldersToSearch = ensureStringArray(options.foldersToSearch);
    var globExpression = options.globExpression || '*';
    var glob = require('glob-fs')({gitignore: true});
    var self = this;
    foldersToSearch.forEach(function (folderToSearch) {
      //In the spirit of scalability let's stream the globbed filenames
      var fileCount = 0;
      glob.readdirStream(globExpression, {cwd: folderToSearch})
        .on('data', function (file) {
          log('Queuing: ' + file.name + '[' + (++fileCount) + ']');
          self._callViaPost('translateFileToGeoTweet',
            {
              path: file.path
            }, function (err, results) {
              log('Translated: ' + file.name);
              if (err) {
                log(err);
              }
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

  post_startTwitterScrape(options, cb) {
    var self = this;
    var boundingBox = options.boundingBox;
    var locations = boundingBox.lngWest.toFixed(4);
    locations += ',' + boundingBox.latSouth.toFixed(4);
    locations += ',' + boundingBox.lngEast.toFixed(4);
    locations += ',' + boundingBox.latNorth.toFixed(4);
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
        self.geoTwitterScrapeHelper.create({
          scraperId,
          scraperActive: true,
          timeStarted: new Date(),
          locations
        }, function (err, scraper) {
          if (err) {
            log(err);
            cb(err);
            return;
          }
          cb(err, scraper);
          //Sign up for stream events we care about
          stream.on('data', function (tweet) {
            log('got tweet...');
            var newTweetsExamined = (scraper.tweetsExamined || 0) + 1;
            scraper.updateAttribute('tweetsExamined', newTweetsExamined, function (err) {
              if (err) {
                log(err);
                return;
              }
            });
            options.tweet = tweet;
            self.post_convertTweetToGeoTweet(options, function(err, convertedTweet) {
              if (err) {
                log(err);
                return;
              }
              if (convertedTweet) {
                self.geoTweetHelper.create(convertedTweet, function(err, geoTweet) {
                  if (err) {
                    log(err);
                    return;
                  }
                  cb(geoTweet);
                });
              }
            });
          });
          stream.on('end', function () {
            var scraperId = this.scraperId;
            self.geoTwitterScrapeHelper.findOne({where: {scraperId}}, function (err, scraper) {
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

  post_stopTwitterScrape(options, cb) {
    try {
      if (!options.scraperId) {
        cb();
        return;
      }
      var twitterStream = inUseTwitterStreams[options.scraperId];
      twitterStream.destroy();
      log('twitter scrape stopped');
      cb();
    } catch (err) {
      log(err);
    }
  }

  get_resetGeoTweetHashtagIndexed(options, cb) {
    var self = this;
    self.geoTweetHelper.updateAll({hashtag_indexed: false}, function (err, result) {
      cb(null, 'Reset hashtag_indexed');
    });
  }

  _callViaPost(restMethod, options, cb) {
    if (!this.restCallTaskQueues[restMethod]) {
      this.restCallTaskQueues[restMethod] = async.queue(this._callViaReST.bind(this), 4);
    }
    options.restMethod = restMethod;
    options.cb = cb;
    this.restCallTaskQueues[restMethod].push(options, function (err) {
      var e = err;
    })
  }

  _callViaReST(options, taskCb) {
    var host = this.app.get('host');
    var port = this.app.get('port');
    var apiName = options.apiName || 'TwitterHashtagClusterer';
    var cb = options.cb || function () {
      };
    var restMethod = options.restMethod;

    request.post({
      url: 'http://' + host + ':' + port + '/' + apiName + '/' + restMethod,
      json: true,
      body: options
    }, function (err, response, body) {
      cb(err, body);
      taskCb();
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

