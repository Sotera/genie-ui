'use strict';

let loopback = require('loopback'),
  _ = require('lodash'),
  path = require('path'),
  filename = path.basename(__filename, '.js'),
  app = require('../../../server/server'),
  ClusteredEvent = app.models.ClusteredEvent,
  log = require('debug')('transforms:' + filename),
  maxZoom = 18, minZoom=0,
  clusterType = filename;

module.exports = {
  run: run
};

function run (eventSources) {
  var points = eventSources.map(source => {
    // sources have irregular [lng,lat] order
    return {
      lng: source.location.coordinates[0],
      lat: source.location.coordinates[1],
      weight: source.num_users
    };
  });

  //TODO: add childId, start, end
  //TODO: apply clustering algorithm to successive zoomlevel
  for (var i=maxZoom; i>=minZoom; i--) {
    ClusteredEvent.create({
      centerPoint: getCenter(points),
      zoomLevel: i,
      coordinates: points,
      startTime: new Date(),
      endTime: new Date(),
      clusterType: clusterType
    }, function(err, event) {
      if (err) log(err);
    });
  }
}

//TODO: use a real center point calculator
function getCenter (points) {
  let _points = _(points), len = points.length,
    sumLats = _points.sum('lat'),
    sumLngs = _points.sum('lng'),
    avgLats = sumLats / len,
    avgLngs = sumLngs / len;

    return new loopback.GeoPoint({lat: avgLats, lng: avgLngs});
}
