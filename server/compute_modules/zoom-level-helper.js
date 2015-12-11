'use strict';
//var log = require('debug')('compute_modules:zoom-level-helper');
var createObj = require('../util/createObj');
var updateObj = require('../util/updateObj');
var async = require('async');
var apiCheck = require('api-check')({
  output: {
    prefix: 'compute_modules:zoom-level-helper',
    docsBaseUrl: 'http://www.example.com/error-docs#'
  },
  verbose: false
});

module.exports = class {
  constructor(app) {
    this.ZoomLevel = app.models.ZoomLevel;
  }

  updateZoomLevels(clusters, zoomLevel, cb) {
    var ZoomLevel = this.ZoomLevel;
    //apiCheck.warn([apiCheck.arrayOf(apiCheck.object), apiCheck.number, apiCheck.func], arguments);
    var coordinates = [];
    var latSum = 0;
    var lngSum = 0;
    var len = clusters.length;
    for (var i = 0; i < len; ++i) {
      coordinates.push({
        lat: clusters[i].centroid[0],
        lng: clusters[i].centroid[1]
      });
      latSum += clusters[i].centroid[0];
      lngSum += clusters[i].centroid[1];
    }
    var centroid = {lat: latSum / len, lng: lngSum / len};
    var newClusteredEvent =
    {
      zoomLevel,
      startTime: new Date(),
      endTime: new Date(),
      clusterType: 'Random',
      events: coordinates,
      centerPoint: centroid
    };
    updateObj(ZoomLevel,
      {zoomLevel: newClusteredEvent.zoomLevel},
      newClusteredEvent,
      function (err) {
        if (err) {
          log('Error inserting Clustered Events: ' + err);
        }
        cb(err);
      });
  }

  initialize(cb) {
    var ZoomLevel = this.ZoomLevel;
    ZoomLevel.deleteAll(function (err) {
      if (err) {
        cb(err);
        return;
      }
      var clusters = [];
      for (var i = 1; i <= 18; ++i) {
        clusters.push({
          zoomLevel: i,
          startTime: new Date(),
          endTime: new Date(),
          clusterType: 'Initialized',
          events: [{lat: 0, lng: 0}],
          centerPoint: {lat: 0, lng: 0}
        });
      }
      var functionArray = [];
      clusters.forEach(function (cluster) {
        functionArray.push(async.apply(createObj,
          ZoomLevel,
          cluster));
      });
      async.parallel(functionArray, cb);
    });
  }
}

