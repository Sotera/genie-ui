'use strict';
//var log = require('debug')('compute_modules:zoom-level-helper');
var createObj = require('../util/createObj');
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

  initialize(cb){
    var ZoomLevel = this.ZoomLevel;
    ZoomLevel.deleteAll(function(err){
      if(err){
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

