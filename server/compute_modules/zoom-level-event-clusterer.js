'use strict';
var log = require('debug')('compute_modules:zoom-level-helper');
var ClustererKMeans = require('../compute_modules/clusterer-kmeans');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var Random = require('random-js');

const clustersPerZoomLevel = [
  1800, 1700, 1600, 1500, 1400, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100
].reverse();

const clustererKMeans = new ClustererKMeans();
const random = new Random(Random.engines.mt19937().autoSeed());

const randomishTags = [
  'disney',
  'waltdisneyworld',
  'wdw',
  'northbrook',
  'me',
  'miamibeach'
];
const randomishPointsOnEarth = [
  {lat: 30.25, lng: -97.5}//Austin
  , {lat: 41.8, lng: -87.67}//Chicago
  , {lat: 39.75, lng: -104.9}//Denver
  , {lat: 25.75, lng: -80.2}//Miami
];

module.exports = class {
  constructor(app) {
    this.zoomLevelHelper = new LoopbackModelHelper('ZoomLevel');
  }

  getEventsForClustererInput(options, cb) {
    var endDate = new Date();//Today
    var intervalDurationMinutes = (24 * 60);
    var intervalsAgo = 1;
    if (arguments.length === 0) {
      throw new Error('Syntax: getEventsForClustererInput([options], callback)');
    }
    else if (arguments.length === 1) {
      if (typeof arguments[0] !== 'function') {
        throw new Error('Syntax: getEventsForClustererInput([options], callback)');
      }
      cb = arguments[0];
    } else if (arguments.length >= 2) {
      if (typeof arguments[1] !== 'function') {
        throw new Error('Syntax: getEventsForClustererInput([options], callback)');
      }
      endDate = options.endDate || endDate;
      intervalDurationMinutes = options.intervalDurationMinutes || intervalDurationMinutes;
      intervalsAgo = options.intervalsAgo || intervalsAgo;
    }

    var minutesAgo = intervalsAgo * intervalDurationMinutes;
    var filterStartDate = moment(endDate);
    filterStartDate.subtract(minutesAgo, 'minutes');
    var filterEndDate = moment(filterStartDate).add(intervalDurationMinutes, 'minutes');

    clusteredEventSourceHelper.find({
      where: {
        post_date: {between: [filterStartDate, filterEndDate]}
      }
    }, function (err, ces) {
      if (err) {
        cb(err, null);
        return;
      }
      var vectorToCluster = [];
      for (var i = 0; i < ces.length; ++i) {
        vectorToCluster[i] = {lat: ces[i].location.coordinates[1], lng: ces[i].location.coordinates[0]};
      }
      cb(err, {minutesAgo, vectorToCluster});
    });
  }

  clusterEvents(options, cb){
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
          if(err){
            log(err);
          }
        });
      } else {
        this.zoomLevelHelper.create(newClusteredEvent, function (err) {
          if(err){
            log(err);
          }
        });
      }
    });
  }

  randomDate(start, end) {
    return new Date(start.getTime() + random.real(0, 1, false) * (end.getTime() - start.getTime()));
  }

  addClusteredEventSources(options, cb) {
    options = options || {};
    if ((arguments.length === 0) ||
      (arguments.length === 1 && typeof arguments[0] !== 'function') ||
      (arguments.length >= 2 && typeof arguments[1] !== 'function')) {
      throw new Error('Syntax: addClusteredEventSources([options], callback)');
    }
    //Setup some defaults for options
    var now = new Date();
    var sixMonthsAgo = new Date(new Date(now).setMonth(now.getMonth() - 6));
    options.clusterCountMin = options.clusterCountMin || 30;
    options.clusterCountMax = options.clusterCountMax || 75;
    options.tags = options.tags || randomishTags;
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
    var newClusteredEventSources = [];
    for (var i = 0; i <= clusterCount; i++) {
      var idx = random.integer(0, options.locCenters.length - 1);
      var r = random.real(options.distFromCenterMin, options.distFromCenterMax);
      var theta = random.real(0, Math.PI * 2);
      var lat = options.locCenters[idx]['lat'] + (r * Math.cos(theta));
      var lng = options.locCenters[idx]['lng'] + (r * Math.sin(theta));
      newClusteredEventSources.push(
        {
          num_users: random.integer(options.minNumUsers, options.maxNumUsers),
          num_posts: random.integer(options.minNumPosts, options.maxNumPosts),
          indexed_date: this.randomDate(options.minIndexDate, options.maxIndexDate),
          post_date: this.randomDate(options.minPostDate, options.maxPostDate),
          tag: options.tags[random.integer(0, options.tags.length - 1)],
          location: {
            type: 'point',
            coordinates: [lng, lat]
          }
        }
      );
    }
    clusteredEventSourceHelper.createMany(newClusteredEventSources, cb);
  }
  convertToDate(obj) {
    if (obj instanceof Date) {
      return obj;
    }
    try {
      return new Date(obj);
    } catch (err) {
      return null;
    }
  }
  initialize(cb) {
    this.zoomLevelHelper.deleteAll(function (err) {
      if (err) {
        cb(err);
        return;
      }
      var clusters = [];
      for (var i = 1; i <= 18; ++i) {
        clusters.push({
          zoomLevel: i,
          minutesAgo: 0,
          clusterType: 'Initialized',
          events: [{lat: 0, lng: 0}],
          centerPoint: {lat: 0, lng: 0}
        });
      }
      this.zoomLevelHelper.createMany(clusters, cb);
    });
  }
}

