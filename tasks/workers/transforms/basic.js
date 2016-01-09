'use strict';

const loopback = require('loopback'),
  _ = require('lodash'),
  path = require('path'),
  filename = path.basename(__filename, '.js'),
  clusterType = filename,
  app = require('../../../server/server'),
  ZoomLevel = app.models.ZoomLevel,
  HashtagEventsSource = app.models.HashtagEventsSource,
  log = require('debug')('transforms:' + filename),
  settings = require('../../../server/util/get-settings'),
  collections = require('../../../server/util/collections'),
  time = require('../../../server/util/time'),
  moment = require('moment'),
  DEFAULT_DAYS_BACK = 7;

module.exports = {
  run: run
};

function run() {
  ZoomLevel.deleteAll();
  settings(['map:minZoom', 'map:maxZoom', 'zoomLevels:startDate',
    'zoomLevels:endDate'], getEventSources);
}

function getEventSources(settings) {
  let now = moment(),
    defaultStart = now.subtract(DEFAULT_DAYS_BACK, 'days').format('YYYY-MM-DD'),
    defaultEnd = now.format('YYYY-MM-DD'),
    endDate = settings['zoomLevels:endDate'] || defaultEnd,
    startDate = settings['zoomLevels:startDate'] || defaultStart,
    numDays = moment(endDate).diff(moment(startDate), 'days'),
    rangeQuery = {},
    mins;

  // range: ex. 1 to n days
  for (let i of collections.range(1, numDays)) {
    mins = time.daysToMinutes(i);
    rangeQuery = {
      gte: endDate + '||-' + mins + 'm',
      lt:  endDate + '||-' + time.daysToMinutes(i-1) + 'm'
    };
    HashtagEventsSource.find({
      native: {
        from: 0,
        // size: 999,
        query: {
          range: {
            post_date: rangeQuery
          }
        }
      }
    }, processEventSources({
        minutesAgo: mins,
        maxZoom: settings['map:maxZoom'],
        minZoom: settings['map:minZoom']
      })
    )
  }
}

// args: minZoom, maxZoom, minutesAgo
function processEventSources(args) {
  return (err, eventSources) => {
    if (err) {
      log(err);
      return;
    }

    var events = eventSources.map(source => {
      // sources have irregular [lng,lat] order
      return {
        lat: source.location.coordinates[1],
        lng: source.location.coordinates[0],
        weight: source.num_users,
        eventId: source.id,
        tag: source.tag
      };
    });

    if (events.length) {
    //TODO: add childId, start, end
    //TODO: apply clustering algorithm to successive zoomlevel
      for (let i of collections.range(args.maxZoom, args.minZoom)) {
        ZoomLevel.create({
          centerPoint: getCenter(events),
          zoomLevel: i,
          events: events,
          clusterType: clusterType,
          minutesAgo: args.minutesAgo
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
