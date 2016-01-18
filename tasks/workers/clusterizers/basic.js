'use strict';

const loopback = require('loopback'),
  _ = require('lodash'),
  path = require('path'),
  filename = path.basename(__filename, '.js'),
  clusterType = filename,
  app = require('../../../server/server'),
  ZoomLevel = app.models.ZoomLevel,
  HashtagEventsSource = app.models.HashtagEventsSource,
  SandboxEventsSource = app.models.SandboxEventsSource,
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


  // range: 1 to n days
  for (let i of collections.range(1, numDays)) {
    mins = time.daysToMinutes(i);
    rangeQuery = {
      gte: endDate + '||-' + mins + 'm',
      lt:  endDate + '||-' + time.daysToMinutes(i-1) + 'm'
    };
    let nativeQuery = {
      native: {
        size: 9999,
        from: 0,
        "_source": {
          "exclude": [ "extra.*" ]
        },
        query: {
          range: {
            post_date: rangeQuery
          }
        }
      }
    };

    // HashtagEventsSource.find(nativeQuery,
    //   processEventSources({
    //     minutesAgo: mins,
    //     maxZoom: settings['map:maxZoom'],
    //     minZoom: settings['map:minZoom'],
    //     eventSource: 'hashtag'
    //   })
    // );

    SandboxEventsSource.find(nativeQuery,
      processEventSources({
        minutesAgo: mins,
        maxZoom: settings['map:maxZoom'],
        minZoom: settings['map:minZoom'],
        eventSource: 'sandbox'
      })
    );
  }
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
          weight: source.num_users,
          eventId: source.id,
          tag: source.tag, // legacy
          extra: { tag: source.tag },
          eventSource: args.eventSource
        };
      } else if (args.eventSource === 'sandbox') {
        return {
          lat: source.location[0],
          lng: source.location[1],
          weight: source.num_images,
          eventId: source.id,
          extra: {
            numImages: source.num_images
          },
          eventSource: args.eventSource
        };
      } else {
        throw new Error('Unknown event source');
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
