'use strict';
if (require('cluster').isMaster) {
  return;
}
var log = require('debug')('boot:routes');
var kmeans = require('node-kmeans');
var async = require('async');
var updateObj = require('../util/updateObj');
var createObj = require('../util/createObj');
var ClusteredEventSourceHelper = require('../compute_modules/clustered-event-source-helper');
var ZoomLevelHelper = require('../compute_modules/zoom-level-helper');
const clustersPerZoomLevel = [
  1800, 1700, 1600, 1500, 1400, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100
];
const randomishPointsOnEarth = [
  {lat: 30.25, lng: -97.5}
  , {lat: 41.8, lng: -87.67}
  , {lat: 39.75, lng: -104.9}
  , {lat: 25.75, lng: -80.2}
];
module.exports = function (app) {
  var clusteredEventSourceHelper = new ClusteredEventSourceHelper(app);
  var zoomLevelHelper = new ZoomLevelHelper(app);
  var ZoomLevel = app.models.ZoomLevel;
  var ClusteredEventSource = app.models.ClusteredEventSource;
  app.get('/initializeClusteredEventSource', function (req, res) {
    clusteredEventSourceHelper.initialize(function (err) {
      var msg = 'Initialized ClusteredEventSource DB';
      if (err) {
        msg = 'Error initializing ClusteredEventSource collection: ' + err;
        log(msg);
      }
      res.status(200).end(msg);
    });
  });
  app.get('/initializeZoomLevel', function (req, res) {
    zoomLevelHelper.initialize(function (err) {
      var msg = 'Initialized ZoomLevel DB';
      if (err) {
        msg = 'Error initializing ZoomLevel collection: ' + err;
        log(msg);
      }
      res.status(200).end(msg);
    });
  });
  app.post('/clusterEventsEx', function (req, res) {
    var zoomLevel = req.body.zoomLevel;
    var msg = 'Clustering @ zoomLevel: ' + zoomLevel;
    msg += ' [' + clustersPerZoomLevel[zoomLevel - 1] + '] clusters.';
    res.status(200).end(msg);
    async.waterfall([
      function (next) {
        //Step 0-0 -> Get the clustered event sources from ES
        clusteredEventSourceHelper.getAllForClustererInput(function (err, vectorToCluster) {
          next(null, vectorToCluster);
        });
      },
      function (vectorToCluster, next) {
        kmeans.clusterize(vectorToCluster, {k: clustersPerZoomLevel[zoomLevel]}, function (err, clusters) {
          updateZoomLevelsInDB(clusters, zoomLevel, function () {
            next();
          });
        });
      }
    ], function (err) {
      if (err) {
        log(err);
      }
    });
  });

  function updateZoomLevelsInDB(clusters, zoomLevel, cb) {
    if (!clusters) {
      log('Clusters is undefined ...');
      cb();
      return;
    }
    var newClusteredEvents = [];
    var coordinates = [];
    for (var i = 0; i < clusters.length; ++i) {
      coordinates.push({
        lat: clusters[i].centroid[0],
        lng: clusters[i].centroid[1]
      });
    }
    log(clustersPerZoomLevel.length - zoomLevel);
    newClusteredEvents.push(
      {
        zoomLevel: clustersPerZoomLevel.length - zoomLevel,
        startTime: new Date(),
        endTime: new Date(),
        clusterType: 'Random',
        events: coordinates,
        centerPoint: {lat: 20, lng: -80}
      }
    );
    var functionArray = [];
    newClusteredEvents.forEach(function (newClusteredEvent) {
      functionArray.push(async.apply(updateObj,
        ZoomLevel,
        {zoomLevel: newClusteredEvent.zoomLevel},
        newClusteredEvent));
    });
    async.parallel(functionArray, function (err) {
      if (err) {
        log('Error inserting Clustered Events: ' + err);
      }
      cb(null);
    });
  }

  app.post('/addSomeClusteredEvents', function (req, res) {
    var options = req.body || {};
    clusteredEventSourceHelper.addClusteredEventSources(options, function (err, addedEventSources) {
      res.status(200).end('<html><h1>' + addedEventSources.length + ' clustered events added </h1></html>');
    });
    /*
     const tags = [
     'disney',
     'waltdisneyworld',
     'wdw',
     'northbrook',
     'me',
     'miamibeach'
     ];
     var ClusteredEventSource = app.models.ClusteredEventSource;
     var newClusteredEventSources = [];
     log('Loading up the dummy ClusteredEventSources, Baby!');
     var async = require('async');
     var findOrCreateObj = require('../util/findOrCreateObj');
     var Random = require('random-js');
     var random = new Random(Random.engines.mt19937().autoSeed())
     for (var i = 0; i <= random.integer(30, 75); i++) {
     var idx = random.integer(0, randomishPointsOnEarth.length - 1);
     var r = random.real(0.05, 0.5);
     var theta = random.real(0, Math.PI * 2);
     var lat = randomishPointsOnEarth[idx]['lat'] + (r * Math.cos(theta));
     var lng = randomishPointsOnEarth[idx]['lng'] + (r * Math.sin(theta));
     newClusteredEventSources.push(
     {
     num_users: random.integer(5, 15),
     indexed_date: new Date(),
     post_date: new Date(),
     tag: tags[random.integer(0, tags.length - 1)],
     num_posts: random.integer(15, 45),
     location: {
     type: 'point',
     coordinates: [lng, lat]
     }
     }
     );
     }
     var functionArray = [];
     newClusteredEventSources.forEach(function (newClusteredEventSource) {
     functionArray.push(async.apply(findOrCreateObj,
     ClusteredEventSource,
     {where: {tag: 'dummy'}},
     newClusteredEventSource));
     });
     async.parallel(functionArray, function (err) {
     if (err) {
     log(err);
     }
     res.status(200).end('Created ' + functionArray.length + ' new ClusteredEventSources!');
     });
     */
  });
}

