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
  var points = eventSources.map((source) => {
    // sources have irregular [lng,lat] order
    return new loopback.GeoPoint({
      lat: source.location.coordinates[1],
      lng: source.location.coordinates[0]
    });
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
  let sumLats = _.sum(points, (point) => { return point.lat }),
    sumLngs = _.sum(points, (point) => { return point.lng }),
    avgLats = sumLats / points.length,
    avgLngs = sumLngs / points.length;

    return new loopback.GeoPoint({lat: avgLats, lng: avgLngs});
}