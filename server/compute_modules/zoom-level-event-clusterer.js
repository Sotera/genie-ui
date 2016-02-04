'use strict';
var log = require('debug')('compute_modules:zoom-level-event-clusterer');
var ClustererKMeans = require('../compute_modules/clusterer-kmeans');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var Random = require('random-js');
var moment = require('moment');
var async = require('async');
var ensureStringArray = require('../util/ensure-string-array');

const clustererKMeans = new ClustererKMeans();

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

  get_generateDevelopmentData(options, cb) {
    options.randomGeneratorSeed = options.randomGeneratorSeed || 0xbaadf00d;
    options.minPostDate = options.minPostDate || '2015-08-16T09:20:00.000Z';
    options.maxPostDate = options.maxPostDate || '2015-08-19T09:45:00.000Z';
    options.eventCountMin = options.eventCountMin || 1200;
    options.eventCountMax = options.eventCountMax || 1500;
    options.modelNames = options.modelNames || ['HashtagEventsSource', 'SandboxEventsSource'];
    options.eventSources = options.eventSources || ['hashtag', 'sandbox'];
    options.endDate = options.endDate || '2015-08-19T09:40:00.000Z';
    options.intervalDurationMinutes = options.intervalDurationMinutes || 1440;
    options.totalIntervals = options.totalIntervals || 4;
    options.zoomLevelClusterCounts = options.zoomLevelClusterCounts || Array(19).fill(8);
    var self = this;
    self.post_createFakeEvents(options, function (err, results) {
      var functionArray = [];
      for (var i = 0; i < options.totalIntervals; ++i) {
        var getEventsOptions = {
          modelNames: options.modelNames,
          endDate: options.endDate,
          intervalDurationMinutes: options.intervalDurationMinutes,
          intervalsAgo: (i + 1)
        };
        functionArray.push(async.apply(self.post_getEventsForClustererInput.bind(self), getEventsOptions));
      }
      async.parallel(functionArray, function (err, results) {
        functionArray = [];
        for (var i = 0; i < options.zoomLevelClusterCounts.length; ++i) {
          results.forEach(function (result) {
            var clusterEventsOptions = {
              zoomLevel: (i + 1),
              endDate: options.endDate,
              clusterCount: options.zoomLevelClusterCounts[i],
              minutesAgo: result.minutesAgo,
              vectorToCluster: result.vectorToCluster
            };
            functionArray.push(async.apply(self.post_clusterEvents.bind(self), clusterEventsOptions));
          });
        }
        async.series(functionArray, function (err, results) {
          functionArray = [];
          results.forEach(function (result) {
            var updateZoomLevelOptions = {
              clusters: result.clusters,
              endDate: result.endDate,
              minutesAgo: result.minutesAgo,
              zoomLevel: result.zoomLevel
            };
            functionArray.push(async.apply(self.post_updateZoomLevel.bind(self), updateZoomLevelOptions));
          });
          async.parallel(functionArray, function (err, result) {
            var operationResult = {
              inputs: {
                randomGeneratorSeed: options.randomGeneratorSeed,
                modelNames: options.modelNames
              }
            };
            cb(err, options);
          });
        });
      });
    });
  }

  post_getEventsForClustererInput(options, cb) {
    var self = this;
    //Have to have a modelName
    if (!options.modelNames) {
      cb(new Error('modelNames required'));
      return;
    }
    options.modelNames = ensureStringArray(options.modelNames);
    options.eventSources = ensureStringArray(options.eventSources);

    var parallelFunctionArray = [];

    options.modelNames.forEach(function (modelName) {
      parallelFunctionArray.push(async.apply(self._getEventsForClustererInput.bind(self), {
        endDate: options.endDate,
        intervalDurationMinutes: options.intervalDurationMinutes,
        intervalsAgo: options.intervalsAgo,
        modelName
      }));
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
    var endDate = this._convertToDate(options.endDate) || new Date();
    var intervalDurationMinutes = options.intervalDurationMinutes || (24 * 60);
    var intervalsAgo = options.intervalsAgo || 1;
    var modelName = options.modelName;

    var minutesAgo = intervalsAgo * intervalDurationMinutes;
    var filterStartDate = moment(endDate);
    filterStartDate.subtract(minutesAgo, 'minutes');
    var filterEndDate = moment(filterStartDate).add(intervalDurationMinutes, 'minutes');
    var modelHelper = new LoopbackModelHelper(modelName);
    if (!modelHelper.isValid()) {
      cb(new Error('Model not found: "' + modelName + '"'));
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
                post_date: ces[i].post_date,
                lat: ces[i].lat,
                lng: ces[i].lng,
                event_id: ces[i].event_id,
                event_source: ces[i].event_source,
                weight: ces[i].num_posts
              };
              if (ces[i].hashtag) {
                vectorToCluster[i].hashtag = ces[i].hashtag;
              }
            }
            cb(err, {minutesAgo, vectorToCluster});
          });
        }],
      function (err, results) {
        cb(err, results);
      });
  }

  post_clusterEvents(options, cb) {
    var vectorToCluster = options.vectorToCluster || [];
    if (!(vectorToCluster instanceof Array) || !vectorToCluster.length) {
      cb(new Error('Invalid clusterer input'));
      return;
    }
    var zoomLevel = options.zoomLevel || 8;
    var clusterCount = options.clusterCount || 20;
    var minutesAgo = options.minutesAgo || 2;
    var endDate = options.endDate || (new Date()).toISOString();
    /*    var msg = 'Clustering @ zoomLevel: ' + zoomLevel;
     msg += ', endDate: ' + endDate;
     msg += ', intervalDurationMinutes: ' + intervalDurationMinutes;
     msg += ', intervalsAgo: ' + intervalsAgo;
     msg += ' [' + clustersPerZoomLevel[zoomLevel - 1] + '] clusters.';*/
    clusterCount = vectorToCluster.length < clusterCount
      ? vectorToCluster.length
      : clusterCount;
    clustererKMeans.geoCluster(vectorToCluster, clusterCount, function (err, kmeanClusters) {
      if (err) {
        cb(err);
        return;
      }
      var clusters = [];
      kmeanClusters.forEach(function (kmeanCluster) {
        var events = [];
        var weight  = 0;
        kmeanCluster.clusterInd.forEach(function (idx) {
          events.push({
            lat: vectorToCluster[idx].lat,
            lng: vectorToCluster[idx].lng,
            event_id: vectorToCluster[idx].event_id,
            weight: vectorToCluster[idx].weight,
            event_source: vectorToCluster[idx].event_source
          });
          weight += vectorToCluster[idx].weight;
        });
        clusters.push({
          lat: kmeanCluster.centroid[0],
          lng: kmeanCluster.centroid[1],
          weight,
          events
        });
      });
      cb(err, {
        endDate,
        zoomLevel,
        minutesAgo,
        clusters
      });
    })
  }

  post_updateZoomLevel(options, cb) {
    var clusters = options.clusters;
    if (!clusters) {
      cb(new Error('Invalid cluster collection'));
      return;
    }
    var zoomLevel = options.zoomLevel;
    var minutesAgo = options.minutesAgo;
    var centerPoint = this._getGeoCenter(clusters);
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
        if (created) {
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

  post_createFakeEvents(options, cb) {
    var self = this;
    options = options || {};
    //Setup some defaults for options
    var now = new Date();
    var sixMonthsAgo = new Date(new Date(now).setMonth(now.getMonth() - 6));
    options.modelNames = options.modelNames || ['HashtagEventsSource'];
    options.eventSources = options.eventSources || ['hashtag'];
    options.eventCountMin = options.eventCountMin || 30;
    options.eventCountMax = options.eventCountMax || 75;
    options.tags = options.tags || randomishTwitterTags;
    options.maxNumUsers = options.maxNumUsers || 35;
    options.minNumUsers = options.minNumUsers || 5;
    options.maxNumPosts = options.maxNumPosts || 35;
    options.minNumPosts = options.minNumPosts || 5;
    options.locCenters = options.locCenters || randomishPointsOnEarth;
    options.distFromCenterMin = options.distFromCenterMin || 0.05;
    options.distFromCenterMax = options.distFromCenterMax || 0.5;
    options.maxPostDate = self._convertToDate(options.maxPostDate) || now;
    options.minPostDate = self._convertToDate(options.minPostDate) || sixMonthsAgo;
    options.maxIndexDate = self._convertToDate(options.maxIndexDate) || now;
    options.minIndexDate = self._convertToDate(options.minIndexDate) || sixMonthsAgo;
    options.sandboxEventSourceFile = options.sandboxEventSourceFile
      || '../../import/sandbox/exampleSandboxEventSource.json';

    var random =
      options.randomGeneratorSeed
        ? new Random(Random.engines.mt19937().seed(options.randomGeneratorSeed))
        : new Random(Random.engines.mt19937().autoSeed());

    var clusterCount = random.integer(options.eventCountMin, options.eventCountMax);
    var newEvents = [];
    for (var i = 0; i <= clusterCount; i++) {
      var idx = random.integer(0, options.locCenters.length - 1);
      var r = random.real(options.distFromCenterMin, options.distFromCenterMax);
      var theta = random.real(0, Math.PI * 2);
      var lat = options.locCenters[idx]['lat'] + (r * Math.cos(theta));
      var lng = options.locCenters[idx]['lng'] + (r * Math.sin(theta));
      newEvents.push(
        {
          event_id: random.uuid4().toString(),
          indexed_date: self._randomDate(options.minIndexDate, options.maxIndexDate),
          post_date: self._randomDate(options.minPostDate, options.maxPostDate),
          num_posts: random.integer(options.minNumPosts, options.maxNumPosts),
          lat,
          lng
        }
      );
    }
    var newEventsByModelName = {};
    var sandboxNetworkGraphInfo = self._getSandboxNetworkGraphInfo(options.sandboxEventSourceFile);
    for (var i = 0; i < newEvents.length; ++i) {
      //var modelNameIdx = i % options.modelNames.length;
      var modelNameIdx = random.integer(0, options.modelNames.length - 1);
      var modelName = options.modelNames[modelNameIdx];
      var eventSource = options.eventSources[modelNameIdx];
      if (!newEventsByModelName[modelName]) {
        newEventsByModelName[modelName] = [];
      }

      //See if we have any external sandbox event specific info
      if (modelName === 'SandboxEventsSource') {
        newEvents[i].network_graph = sandboxNetworkGraphInfo.network_graph || {};
        newEvents[i].node_to_url = sandboxNetworkGraphInfo.node_to_url || [];
      } else if (modelName === 'HashtagEventsSource') {
        newEvents[i].hashtag = options.tags[random.integer(0, options.tags.length - 1)];
        newEvents[i].num_unique_users = random.integer(options.minNumUsers, options.maxNumUsers);
      }
      newEvents[i].event_source = eventSource;
      newEventsByModelName[modelName].push(newEvents[i]);
    }

    var functionArray = [];
    for (var modelName in newEventsByModelName) {
      functionArray.push(async.apply(self._createEvents.bind(self), modelName, newEventsByModelName[modelName]));
    }
    async.series(functionArray, function (err, results) {
      var createdCount = 0;
      results.forEach(function (result) {
        createdCount += result.createdCount;
      });
      cb(err, {createdCount});
    });
  }

  _createEvents(modelName, newEvents, cb) {
    var modelHelper = new LoopbackModelHelper(modelName);
    if (!modelHelper.isValid()) {
      cb(new Error('Model not found: "' + modelName + '"'));
      return;
    }
    var queries = newEvents.map(function (newEvent) {
      return {where: {event_id: newEvent.event_id}};
    })
    modelHelper.findOrCreateMany(queries, newEvents, function (err, results) {
      var createdCount = 0;
      results.forEach(function (result) {
        if (result[1]) {
          ++createdCount;
        }
      });
      cb(err, {createdCount});
    });
  }

  _getGeoCenter(locs) {
    //Assume locs is an array of objects that have 'lat' & 'lng' properties
    if ((!(locs instanceof Array))
      || (!(locs.length && locs[0].lat && locs[0].lng))) {
      throw new Error('_getGeoCenter() bad param')
    }
    var len = locs.length;
    var latSum = 0;
    var lngSum = 0;
    for (var i = 0; i < len; ++i) {
      latSum += locs[i].lat;
      lngSum += locs[i].lng;
    }
    return {lat: latSum / len, lng: lngSum / len};
  }

  _randomDate(start, end) {
    var random = new Random(Random.engines.mt19937().autoSeed());
    return new Date(start.getTime() + random.real(0, 1, false) * (end.getTime() - start.getTime()));
  }

  _getSandboxNetworkGraphInfo(relativePath) {
    var retVal = {};
    if (relativePath) {
      try {
        var fs = require('fs');
        var path = require('path');
        var fullPath = path.join(__dirname, relativePath);
        var o = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        retVal = {network_graph: o.network_graph, node_to_url: o.node_to_url};
      } catch (err) {
        log(err);
      }
    }
    return retVal;
  }

  _convertToDate(obj) {
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

