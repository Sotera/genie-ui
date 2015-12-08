'use strict';

let loopback = require('loopback'),
  _ = require('lodash'),
  path = require('path'),
  filename = path.basename(__filename, '.js'),
  app = require('../../../server/server'),
  ZoomLevel = app.models.ZoomLevel,
  ClusteredEventSource = app.models.ClusteredEventSource,
  log = require('debug')('transforms:' + filename),
  maxZoom = 18, minZoom=0,
  clusterType = filename,
  util = require('../../../lib/util/collections');

module.exports = {
  run: run
};

function run() {
  function daysToMinutes(numDays) {
    return numDays * 24 * 60;
  }

  for (let i of util.range(0, 10, 1)) {
    i = daysToMinutes(i);
    ClusteredEventSource.find({
      native: {
        from: 0,
        // size: 999,
        query: {
          range: {
            post_date: {
              gte: 'now-' + i + 'm',
              lt: 'now'
            }
          }
        }
      }
    }, processEventSources(i))
  }
}

function processEventSources(minutesAgo) {
  return (err, eventSources) => {
    if (err) {
      log(err);
      return;
    }

    var events = eventSources.map(source => {
      // sources have irregular [lng,lat] order
      return {
        lng: source.location.coordinates[0],
        lat: source.location.coordinates[1],
        weight: source.num_users,
        eventId: source.id,
        tag: source.tag
      };
    });

    if (events.length) {
    //TODO: add childId, start, end
    //TODO: apply clustering algorithm to successive zoomlevel
      for (var i=maxZoom; i>=minZoom; i--) {
        ZoomLevel.create({
          centerPoint: getCenter(events),
          zoomLevel: i,
          events: events,
          clusterType: clusterType,
          minutesAgo: minutesAgo
        }, function(err, event) {
          if (err) log(err);
        });
      }
    }

  };
}

//TODO: use a real center point calculator
// accepts objects with lat, lng attrs
function getCenter (points) {
  let _points = _(points), len = points.length,
    sumLats = _points.sum('lat'),
    sumLngs = _points.sum('lng'),
    avgLats = sumLats / len,
    avgLngs = sumLngs / len;

    return new loopback.GeoPoint({lat: avgLats, lng: avgLngs});
}
