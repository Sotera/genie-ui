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

  let time0 = '2015-06-05';
  let rangeQuery = {};
  let mins;
  // range: ex. 1 to n days
  for (let i of util.range(1, 7)) {
    mins = daysToMinutes(i);
    rangeQuery = {
      gte: time0 + '||-' + mins + 'm'
    };
    if (i > 1) { // add upper bounds after first day
      rangeQuery.lt = time0 + '||-' + daysToMinutes(i-1) + 'm';
    }
    ClusteredEventSource.find({
      native: {
        from: 0,
        // size: 999,
        query: {
          range: {
            post_date: rangeQuery
          }
        }
      }
    }, processEventSources(mins))
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
      for (let i of util.range(maxZoom, minZoom)) {
        ZoomLevel.create({
          centerPoint: getCenter(events),
          zoomLevel: i,
          events: events,
          clusterType: clusterType,
          minutesAgo: minutesAgo
        }, (err, event) => {
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
