'use strict';
var log = require('debug')('compute_modules:zoom-level-event-clusterer');
var ClustererKMeans = require('../compute_modules/clusterer-kmeans');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var Random = require('random-js');
var moment = require('moment');
var async = require('async');

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
  }

  getEventsForClustererInput(options, cb) {
    var self = this;
    //Have to have a modelName
    if (!options.modelNames) {
      cb(new Error('modelNames required'));
      return;
    }
    if (!(options.modelNames instanceof Array)) {
      if (typeof options.modelNames !== 'string') {
        cb(new Error('modelNames must be a "String" or array of "String'));
        return;
      }
      options.modelNames = [options.modelNames];
    }
    var parallelFunctionArray = [];

    options.modelNames.forEach(function (modelName) {
      options.modelName = modelName;
      parallelFunctionArray.push(async.apply(self._getEventsForClustererInput.bind(self), options));
    });

    async.parallel(parallelFunctionArray, function (err, results) {
      if (err) {
        cb(err);
        return;
      }
      //Since these results will be the results of parallel execution they will really be
      //an array of result arrays. So flatten them.
      if (!(results instanceof Array) || results.length === 0 || !results[0].minutesAgo) {
        cb(new Error('ERROR: bad response from clusterer'));
        return;
      }
      var minutesAgo = results[0].minutesAgo;
      var vectorToCluster = [];
      results.forEach(function (result) {
        result.vectorToCluster.forEach(function (v) {
          vectorToCluster.push(v);
        });
      });
      cb(err, {
        endDate: options.endDate,
        minutesAgo,
        vectorToCluster
      });
    });
  }

  _getEventsForClustererInput(options, cb) {
    var endDate = this.convertToDate(options.endDate) || new Date();
    var intervalDurationMinutes = options.intervalDurationMinutes || (24 * 60);
    var intervalsAgo = options.intervalsAgo || 1;

    var minutesAgo = intervalsAgo * intervalDurationMinutes;
    var filterStartDate = moment(endDate);
    filterStartDate.subtract(minutesAgo, 'minutes');
    var filterEndDate = moment(filterStartDate).add(intervalDurationMinutes, 'minutes');
    var modelHelper = new LoopbackModelHelper(options.modelName);
    if (!modelHelper.isValid()) {
      cb(new Error('Model not found: "' + options.modelName + '"'));
      return;
    }

    async.waterfall(
      [
        function getEventsCount(cb) {
          modelHelper.count(function (err, count) {
            cb(err, count);
          });
        },
        function findEventsTimeWindow(count, cb) {
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
          modelHelper.find(dateWindowQuery, function (err, ces) {
            if (err) {
              cb(err, null);
              return;
            }
            var vectorToCluster = [];
            for (var i = 0; i < ces.length; ++i) {
              log(ces[i].post_date);
              vectorToCluster[i] = {
                lat: ces[i].lat,
                lng: ces[i].lng,
                event_id: ces[i].event_id,
                event_source: ces[i].event_source
              };
            }
            cb(err, {minutesAgo, vectorToCluster});
          });
        }],
      function (err, results) {
        cb(err, results);
      });
  }

  clusterEvents(options, cb) {
    options.zoomLevel = options.zoomLevel || 8;
    options.clusterCount = options.clusterCount || 20;
    /*    var msg = 'Clustering @ zoomLevel: ' + zoomLevel;
     msg += ', endDate: ' + endDate;
     msg += ', intervalDurationMinutes: ' + intervalDurationMinutes;
     msg += ', intervalsAgo: ' + intervalsAgo;
     msg += ' [' + clustersPerZoomLevel[zoomLevel - 1] + '] clusters.';*/
    options.clusterCount = options.vectorToCluster.length < options.clusterCount
      ? options.vectorToCluster.length
      : options.clusterCount;
    clustererKMeans.geoCluster(options.vectorToCluster, options.clusterCount, function (err, kmeanClusters) {
      if (err) {
        cb(err);
        return;
      }
      var clusters = [];
      kmeanClusters.forEach(function (kmeanCluster) {
        var events = [];
        kmeanCluster.clusterInd.forEach(function (idx) {
          events.push({
            lat: options.vectorToCluster[idx].lat,
            lng: options.vectorToCluster[idx].lng,
            event_id: options.vectorToCluster[idx].event_id,
            event_source: options.vectorToCluster[idx].event_source
          });
        });
        clusters.push({
          lat: kmeanCluster.centroid[0],
          lng: kmeanCluster.centroid[1],
          weight: events.length,
          events
        });
      });
      cb(err, {
        endDate: options.endDate,
        zoomLevel: options.zoomLevel,
        minutesAgo: options.minutesAgo,
        clusters
      });
    })
  }

  updateZoomLevel(options, cb) {
    var clusters = options.clusters;
    var zoomLevel = options.zoomLevel;
    var minutesAgo = options.minutesAgo;
    var centerPoint = this.getGeoCenter(clusters);
    /*    cb(null, 'hello');
     return;*/
    var newZoomLevel =
    {
      zoom_level: zoomLevel,
      minutes_ago: minutesAgo,
      clusters,
      center_lat: centerPoint.lat,
      center_lng: centerPoint.lng
    };
    this.zoomLevelHelper.findOrCreate({
        where: {
          and: [
            {zoom_level: newZoomLevel.zoom_level},
            {minutes_ago: newZoomLevel.minutes_ago}
          ]
        }
      },
      newZoomLevel,
      function (err, zoomLevel, created) {
        if (err) {
          log(err);
          cb(err);
          return;
        }
        if(created){
          //No need to update
          cb(err, 'ZoomLevel created');
          return;
        }
        zoomLevel.updateAttributes(newZoomLevel, function (err) {
          if (err) {
            log(err);
            cb(err);
            return;
          }
          cb(err, 'ZoomLevel updated');
        });
      });
  }

  createFakeEvents(options, cb) {
    options = options || {};
    //Setup some defaults for options
    var now = new Date();
    var sixMonthsAgo = new Date(new Date(now).setMonth(now.getMonth() - 6));
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
          event_id: random.uuid4().toString(),
          event_source: 'hashtag',
          num_users: random.integer(options.minNumUsers, options.maxNumUsers),
          num_posts: random.integer(options.minNumPosts, options.maxNumPosts),
          indexed_date: this.randomDate(options.minIndexDate, options.maxIndexDate),
          post_date: this.randomDate(options.minPostDate, options.maxPostDate),
          hashtag: options.tags[random.integer(0, options.tags.length - 1)],
          lat,
          lng
        }
      );
    }
    var modelHelper = new LoopbackModelHelper(options.modelName);
    if (!modelHelper.isValid()) {
      cb(new Error('Model not found: "' + options.modelName + '"'));
      return;
    }
    modelHelper.createMany(newHashtagEvents, function (err, result) {
      var msg = err ? 'ERROR' : 'Created ' + result.length + ' fake "' + options.modelName + '" events.';
      cb(err, msg);
    });
  }

  getGeoCenter(locs) {
    //Assume locs is an array of objects that have 'lat' & 'lng' properties
    if ((!(locs instanceof Array))
      || (!(locs.length && locs[0].lat && locs[0].lng))) {
      throw new Error('getGeoCenter() bad param')
    }
    var len = locs.length;
    var latSum = 0;
    var lngSum = 0;
    for (var i = 0; i < len; ++i) {
      latSum = locs[i].lat;
      lngSum = locs[i].lng;
    }
    return {lat: latSum / len, lng: lngSum / len};
  }

  randomDate(start, end) {
    return new Date(start.getTime() + random.real(0, 1, false) * (end.getTime() - start.getTime()));
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

