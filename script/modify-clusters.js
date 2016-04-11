#!/usr/bin/env node
'use strict';

// merge zoomlevels for demo convenience

var _ = require('lodash'),
  app = require('../server/server'),
  ZoomLevel = app.models.ZoomLevel,
  sourceMinsAgo = 2880, targetMinsAgo = 1440;

// ZoomLevel.find({ where: { minutes_ago: {inq:[sourceMinsAgo, targetMinsAgo]} } })
// .then(mergeZoomLevels)
// .then(() => console.log('done'))
// .catch(console.error)

ZoomLevel.findOne({ where: { minutes_ago: sourceMinsAgo } })
.then(createZoomLevels)
.then(() => console.log('done'))
.catch(console.error)

function mergeZoomLevels(zoomLevels) {
  // jsut get the first source. all clusters are the same for each level.
  var source = _.detect(zoomLevels, z => z.minutes_ago === sourceMinsAgo);

  // update all targets
  var targets = _.filter(zoomLevels, z => z.minutes_ago === targetMinsAgo);
  targets.forEach(zoom => {
    zoom.updateAttribute('clusters', zoom.clusters.concat(source.clusters));
  });
  // return target;
}

function createZoomLevels(toCopy) {
  for(var i=1; i<=20; i++) {
    ZoomLevel.create({minutes_ago: targetMinsAgo, zoom_level: i,
      center_lng: toCopy.center_lng, center_lat: toCopy.center_lat,
      clusters: toCopy.clusters});
  }
}
