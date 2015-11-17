var loopback = require('loopback'),
  path = require('path'),
  filename = path.basename(__filename, '.js'),
  app = require('../../server/server'),
  ClusteredEvent = app.models.ClusteredEvent,
  log = require('debug')('transforms:' + filename),
  maxZoom = 10,
  clusterType = filename;

module.exports = {
  run: run
};

function run (eventSources) {
  var coordinatesCollection = eventSources.map(function(source) {
    return new loopback.GeoPoint({
      lat: source.location.coordinates[0],
      lng: source.location.coordinates[1]
    });
  });

  //TODO: add childId, start, end
  for (var i=maxZoom; i>0; i--) {
    ClusteredEvent.create({
      zoomLevel: i,
      coordinates: coordinatesCollection,
      startTime: new Date(),
      endTime: new Date(),
      clusterType: clusterType
    }, function(err, event) {
      log(err);
    });
  }
}
