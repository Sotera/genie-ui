'use strict';
var log = require('debug')('compute_modules:zoom-level-event-clusterer');
var ClustererKMeans = require('../compute_modules/clusterer-kmeans');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var Random = require('random-js');
var moment = require('moment');
var async = require('async');

const clustersPerZoomLevel = [
  1800, 1700, 1600, 1500, 1400, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100
].reverse();

const clustererKMeans = new ClustererKMeans();
const random = new Random(Random.engines.mt19937().autoSeed());

const randomishTwitterTags = ['indicter', 'abacisci', 'anastrophe', 'pentatomic', 'hyaluronidase', 'canalatura',
  'schizopod', 'undervicar', 'aeciospore', 'iodization', 'newmanism', 'inhibition', 'favelvellae', 'sackbut'];

const randomishPointsOnEarth = [
  {lat: 30.25, lng: -97.5}//Austin
  , {lat: 41.8, lng: -87.67}//Chicago
  , {lat: 39.75, lng: -104.9}//Denver
  , {lat: 25.75, lng: -80.2}//Miami
];

module.exports = class {
  constructor(app) {
    this.zoomLevelHelper = new LoopbackModelHelper('ZoomLevel');
    this.sandboxEventsSourceHelper = new LoopbackModelHelper('SandboxEventsSource');
    this.hashtagEventsSourceHelper = new LoopbackModelHelper('HashtagEventsSource');
  }

  getEventsForClustererInput(options, cb) {
    var endDate = this.convertToDate(options.endDate) || new Date();
    var intervalDurationMinutes = options.intervalDurationMinutes || (24 * 60);
    var intervalsAgo = options.intervalsAgo || 1;

    var minutesAgo = intervalsAgo * intervalDurationMinutes;
    var filterStartDate = moment(endDate);
    filterStartDate.subtract(minutesAgo, 'minutes');
    var filterEndDate = moment(filterStartDate).add(intervalDurationMinutes, 'minutes');

    var self = this;
    async.waterfall(
      [
        function getSandboxEventsCount(cb) {
          self.hashtagEventsSourceHelper.count(function (err, count) {
            cb(err, count);
          });
        },
        function findSandboxEventsTimeWindow(count, cb) {
          var dateWindowQuery = {
            where: {
              and: [
                {post_date: {gte: filterStartDate}},
                {post_date: {lte: filterEndDate}}
              ]
            },
            limit: count
          };
/*          dateWindowQuery = {
            limit: 20
          };*/
          self.hashtagEventsSourceHelper.find(dateWindowQuery, function (err, ces) {
            if (err) {
              cb(err, null);
              return;
            }
            var vectorToCluster = [];
            for (var i = 0; i < ces.length; ++i) {
              log(ces[i].post_date);
              vectorToCluster[i] = {lat: ces[i].lat, lng: ces[i].lng};
            }
            cb(err, {minutesAgo, vectorToCluster});
          });
        }],
      function (err, results) {
        cb(err, results);
      });
  }

  clusterEvents(options, cb) {
    var zoomLevel = options.zoomLevel || 8;
    var endDate = options.endDate || new Date();
    var intervalDurationMinutes = options.intervalDurationMinutes || (24 * 60);
    var intervalsAgo = options.intervalsAgo || 1;
    var msg = 'Clustering @ zoomLevel: ' + zoomLevel;
    msg += ', endDate: ' + endDate;
    msg += ', intervalDurationMinutes: ' + intervalDurationMinutes;
    msg += ', intervalsAgo: ' + intervalsAgo;
    msg += ' [' + clustersPerZoomLevel[zoomLevel - 1] + '] clusters.';
    res.status(200).end(msg);
    clusteredEventSourceHelper.getEventsForClustererInput({
      endDate,
      intervalDurationMinutes,
      intervalsAgo
    }, function (err, clustererInput) {
      if (err) {
        log(err);
        return;
      }
      var vectorToCluster = clustererInput.vectorToCluster;
      var minutesAgo = clustererInput.minutesAgo;
      var clusterCount = vectorToCluster.length < clustersPerZoomLevel[zoomLevel]
        ? vectorToCluster.length
        : clustersPerZoomLevel[zoomLevel];
      clustererKMeans.geoCluster(vectorToCluster, clusterCount, function (err, clusters) {
        if (err) {
          log(err);
          return;
        }
        zoomLevelHelper.updateZoomLevels({
          clusterType: 'k-means', clusters, zoomLevel, minutesAgo
        }, function (err) {
          if (err) {
            log(err);
          }
        });
      })
    });
  }

  updateZoomLevels(options, cb) {
    var clusters = options.clusters;
    var zoomLevel = options.zoomLevel;
    var minutesAgo = options.minutesAgo;
    var clusterType = options.clusterType;
    var events = [];
    var latSum = 0;
    var lngSum = 0;
    var len = clusters.length;
    for (var i = 0; i < len; ++i) {
      var lat = clusters[i].centroid[0];
      var lng = clusters[i].centroid[1];
      events.push({lat, lng});
      latSum += lat;
      lngSum += lng;
    }
    var centerPoint = {lat: latSum / len, lng: lngSum / len};
    var newClusteredEvent =
    {
      zoomLevel,
      minutesAgo,
      events,
      centerPoint,
      clusterType
    };
    this.zoomLevelHelper.find({
      where: {
        and: [
          {zoomLevel: newClusteredEvent.zoomLevel},
          {minutesAgo: newClusteredEvent.minutesAgo}
        ]
      }
    }, function (err, zoomLevels) {
      if (zoomLevels.length) {
        if (zoomLevels.length > 1) {
          var msg = 'Too many ZoomLevels for zoomLevel: ' + newClusteredEvent.zoomLevel;
          msg += ' and minutesAgo: ' + newClusteredEvent.minutesAgo;
          log(msg);
        }
        zoomLevels[0].updateAttributes(newClusteredEvent, function (err) {
          if (err) {
            log(err);
          }
        });
      } else {
        this.zoomLevelHelper.create(newClusteredEvent, function (err) {
          if (err) {
            log(err);
          }
        });
      }
    });
  }

  randomDate(start, end) {
    return new Date(start.getTime() + random.real(0, 1, false) * (end.getTime() - start.getTime()));
  }

  createFakeEvents(options, cb) {
    options = options || {};
    //Setup some defaults for options
    var now = new Date();
    var sixMonthsAgo = new Date(new Date(now).setMonth(now.getMonth() - 6));
    options.eventId = options.eventId || random.uuid4().toString();
    options.clusterCountMin = options.clusterCountMin || 30;
    options.clusterCountMax = options.clusterCountMax || 75;
    options.tags = options.tags || randomishTwitterTags;
    options.maxNumUsers = options.maxNumUsers || 35;
    options.minNumUsers = options.minNumUsers || 5;
    options.maxNumPosts = options.maxNumPosts || 35;
    options.minNumPosts = options.minNumPosts || 5;
    options.locCenters = options.locCenters || randomishPointsOnEarth;
    options.distFromCenterMin = options.distFromCenterMin || 0.05;
    options.distFromCenterMax = options.distFromCenterMax || 0.5;
    options.maxPostDate = this.convertToDate(options.maxPostDate) || now;
    options.minPostDate = this.convertToDate(options.minPostDate) || sixMonthsAgo;
    options.maxIndexDate = this.convertToDate(options.maxIndexDate) || now;
    options.minIndexDate = this.convertToDate(options.minIndexDate) || sixMonthsAgo;

    var clusterCount = random.integer(options.clusterCountMin, options.clusterCountMax);
    var newHashtagEvents = [];
    for (var i = 0; i <= clusterCount; i++) {
      var idx = random.integer(0, options.locCenters.length - 1);
      var r = random.real(options.distFromCenterMin, options.distFromCenterMax);
      var theta = random.real(0, Math.PI * 2);
      var lat = options.locCenters[idx]['lat'] + (r * Math.cos(theta));
      var lng = options.locCenters[idx]['lng'] + (r * Math.sin(theta));
      newHashtagEvents.push(
        {
          eventId: options.eventId,
          num_users: random.integer(options.minNumUsers, options.maxNumUsers),
          num_posts: random.integer(options.minNumPosts, options.maxNumPosts),
          indexed_date: this.randomDate(options.minIndexDate, options.maxIndexDate),
          post_date: this.randomDate(options.minPostDate, options.maxPostDate),
          tag: options.tags[random.integer(0, options.tags.length - 1)],
          lat,
          lng
        }
      );
    }
    this.hashtagEventsSourceHelper.createMany(newHashtagEvents, function (err, result) {
      var msg = err ? 'ERROR' : 'Created ' + result.length + ' fake "hashtag" events.';
      cb(err, msg);
    });
  }

  convertToDate(obj) {
    if (obj instanceof Date) {
      return obj;
    }
    try {
      var tryDate = Date.parse(obj);
      return isNaN(tryDate) ? null : new Date(tryDate);
    } catch (err) {
      return null;
    }
  }
}

