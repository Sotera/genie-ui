'use strict';
var log = require('debug')('boot:event-clustering');
var kmeans = require('node-kmeans');
var async = require('async');
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
    var zoomLevel = req.body.zoomLevel || 8;
    var endDate = req.body.endDate || new Date();
    var intervalDurationMinutes = req.body.intervalDurationMinutes || (24 * 60);
    var intervalsAgo = req.body.intervalsAgo || 1;
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
  });

  app.post('/addSomeClusteredEvents', function (req, res) {
    var now = new Date(2015, 3, 1);
    var sixMonthsAgo = new Date(new Date(now).setMonth(now.getMonth() - 6));
    var options = {
      clusterCountMin: req.body.clusterCountMin || 10,
      clusterCountMax: req.body.clusterCountMax || 30,
      tags: req.body.tags || ['north', 'south', 'east', 'west', 'green', 'blue', 'purple'],
      maxNumUsers: req.body.maxNumUsers = req.body.maxNumUsers || 35,
      minNumUsers: req.body.minNumUsers = req.body.minNumUsers || 5,
      maxNumPosts: req.body.maxNumPosts = req.body.maxNumPosts || 35,
      minNumPosts: req.body.minNumPosts = req.body.minNumPosts || 5,
      distFromCenterMin: req.body.distFromCenterMin || 0.1,
      distFromCenterMax: req.body.distFromCenterMax || 1.0,
      minPostDate: req.body.minPostDate || sixMonthsAgo,
      maxPostDate: req.body.maxPostDate || now,
      minIndexDate: req.body.minIndexDate || sixMonthsAgo,
      maxIndexDate: req.body.maxIndexDate || now,
      locCenters: req.body.locCenters || [
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
}

