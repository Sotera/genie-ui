'use strict';

// to enable these logs set `DEBUG=boot:03-load-content` or `DEBUG=boot:*`
var log = require('debug')('boot:03-load-content');
var getSettings = require('../util/getSettings');

module.exports = function (app, cb) {
  getSettings([
    'loadUpSomeClusteredEventsBaby'
  ], function (settings) {
    var ClusteredEvent = app.models.ClusteredEvent;
    var newClusteredEvents = [];
    if (settings['loadUpSomeClusteredEventsBaby']) {
      log('Loading up the dummy ClusteredEvents, Baby!');
      var async = require('async');
      var findOrCreateObj = require('../util/findOrCreateObj');
      var Random = require('random-js');
      var random = new Random(Random.engines.mt19937().autoSeed())
      for (var i = 0; i <= 18; i++) {
        var coordinates = [];
        for (var j = 0; j <= random.integer(4, 8); j++) {
          coordinates.push({
              lat: random.real(-90, 90),
              lng: random.real(-170, 170)
            }
          );
        }
        newClusteredEvents.push(
          {
            uuid: i,
            zoomLevel: i,
            startTime: new Date(),
            endTime: new Date(),
            clusterType: 'Random',
            coordinates,
            centerPoint: coordinates[0]
          }
        );
      }
      var functionArray = [];
      newClusteredEvents.forEach(function (newClusteredEvent) {
        functionArray.push(async.apply(findOrCreateObj,
          ClusteredEvent,
          {where: {uuid: newClusteredEvent.uuid}},
          newClusteredEvent));
      });
      async.parallel(functionArray, function (err) {
        if (err) {
          log(err);
        }
        cb();
      });
    }else{
      cb();
    }
  });
};
