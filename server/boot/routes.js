'use strict';
var log = require('debug')('boot:routes');
var kmeans = require('node-kmeans');
var async = require('async');
var updateObj = require('../util/updateObj');
var createObj = require('../util/createObj');
var ClusteredEventSourceHelper = require('../compute_modules/clustered-event-source-helper');
var ZoomLevelHelper = require('../compute_modules/zoom-level-helper');
var ClustererKMeans = require('../compute_modules/clusterer-kmeans');
var Random = require('random-js');
var random = new Random(Random.engines.mt19937().autoSeed());
const clustersPerZoomLevel = [
  1800, 1700, 1600, 1500, 1400, 1300, 1200, 1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100
].reverse();
module.exports = function (app) {
  var clusteredEventSourceHelper = new ClusteredEventSourceHelper(app);
  var zoomLevelHelper = new ZoomLevelHelper(app);
  var clustererKMeans = new ClustererKMeans();
  var ZoomLevel = app.models.ZoomLevel;
  var ClusteredEventSource = app.models.ClusteredEventSource;
  app.get('/initializeClusteredEventSource', function (req, res) {
    initialize(clusteredEventSourceHelper, res, 'ClusteredEventSource');
  });
  app.get('/initializeZoomLevel', function (req, res) {
    initialize(zoomLevelHelper, res, 'ZoomLevel');
  });
  function initialize(helper, res, modelName) {
    modelName = modelName || 'Model';
    helper.initialize(function (err) {
      var msg = 'Initialized ' + modelName + ' DB';
      if (err) {
        msg = 'Error initializing ' + modelName + ' collection: ' + err;
        log(msg);
      }
      res.status(200).end(msg);
    });
  }

  app.post('/clusterEvents', function (req, res) {
    var zoomLevel = req.body.zoomLevel;
    var msg = 'Clustering @ zoomLevel: ' + zoomLevel;
    msg += ' [' + clustersPerZoomLevel[zoomLevel - 1] + '] clusters.';
    res.status(200).end(msg);
    clusteredEventSourceHelper.getAllForClustererInput(function (err, vectorToCluster) {
      clustererKMeans.geoCluster(vectorToCluster, clustersPerZoomLevel[zoomLevel], function (err, clusters) {
        if (err) {
          log(err);
          return;
        }
        zoomLevelHelper.updateZoomLevels(clusters, zoomLevel, function (err) {
          if (err) {
            log(err);
          }
        });
      })
    });
  });

  app.post('/addSomeClusteredEvents', function (req, res) {
    var date = randomDate(new Date(2015, 0, 1), new Date())
    var options = req.body || {
        clusterCountMin: 10,
        clusterCountMax: 30,
        tags: ['north', 'south', 'east', 'west'],
        numUsers: random.integer(3, 8),
        numPosts: random.integer(3, 8),
        distFromCenterMin: 0.1,
        distFromCenterMax: 1.0,
        postDate: date,
        indexDate: date,
        locCenters: [
          {lat: 20.25, lng: -97.5}
          , {lat: 30.25, lng: -100.5}
          , {lat: 40.25, lng: -103.5}
          , {lat: 50.25, lng: -105.5}
          , {lat: 60.25, lng: -100.5}
          , {lat: 70.25, lng: -97.5}
        ]
      };
    clusteredEventSourceHelper.addClusteredEventSources(options, function (err, addedEventSources) {
      res.status(200).end(addedEventSources.length + ' clustered events added');
    });
  });

  function randomDate(start, end) {
    return new Date(start.getTime() + random.real(0, 1, false) * (end.getTime() - start.getTime()));
  }
}

