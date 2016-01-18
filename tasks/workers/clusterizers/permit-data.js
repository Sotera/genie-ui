'use strict';

const loopback = require('loopback'),
  _ = require('lodash'),
  path = require('path'),
  filename = path.basename(__filename, '.js'),
  clusterType = filename,
  app = require('../../../server/server'),
  ZoomLevel = app.models.ZoomLevel,
  HashtagEventsSource = app.models.HashtagEventsSource,
  log = require('../../../server/util/debug').log('transforms'),
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
  settings(['map:minZoom', 'map:maxZoom'], getEventSources);
}

function getEventSources(settings) {
  const PERIOD = 90, // days
    DAY = 1440; // mins

  function periodToMins(numSteps) {
    return DAY * PERIOD * numSteps;
  }

  [
    '2013.0','2013.25','2013.5','2013.75',
    '2014.0','2014.25','2014.5','2014.75',
    '2015.0','2015.25','2015.5','2015.75'
  ].reverse()
  .forEach(function(dateLabel, idx) {
    HashtagEventsSource.find(
      {
        where: {
          post_date: dateLabel
        }
      },
      processEventSources({
        minutesAgo: periodToMins(idx+1),
        maxZoom: settings['map:maxZoom'],
        minZoom: settings['map:minZoom'],
        eventSource: 'hashtag'
      })
    );
  })

  // }
}

// args: minZoom, maxZoom, minutesAgo, eventSource
function processEventSources(args) {
  return (err, eventSources) => {
    if (err) {
      log(err);
      return;
    }

    var events = eventSources.map(source => {
      if (args.eventSource === 'hashtag') {
        // source has irregular [lng,lat] order
        return {
          lat: source.location.coordinates[1],
          lng: source.location.coordinates[0],
          weight: source.num_posts,
          eventId: source.id,
          tag: source.tag, // legacy
          extra: { tag: source.tag, max_val: source.max_val,
            min_val: source.min_val },
          eventSource: args.eventSource
        };
      }
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
