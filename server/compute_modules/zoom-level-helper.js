'use strict';
//var log = require('debug')('compute_modules:zoom-level-helper');
var createObj = require('../util/create-obj');
var updateObj = require('../util/update-obj');
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

  updateZoomLevels(zoomLevelInfo, cb) {
    var ZoomLevel = this.ZoomLevel;
    //apiCheck.warn([apiCheck.arrayOf(apiCheck.object), apiCheck.number, apiCheck.func], arguments);
    var clusters = zoomLevelInfo.clusters;
    var zoomLevel = zoomLevelInfo.zoomLevel;
    var minutesAgo = zoomLevelInfo.minutesAgo;
    var clusterType = zoomLevelInfo.clusterType;
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
    ZoomLevel.find({
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
          log(err);
        });
      } else {
        createObj(ZoomLevel, newClusteredEvent, function (err) {
          log(err);
        });
      }
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
          minutesAgo: 0,
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

