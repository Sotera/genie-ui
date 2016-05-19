#!/usr/bin/env node
'use strict';

const app = require('../server/server'),
  LoopbackModelHelper = require('../server/util/loopback-model-helper'),
  Chart = new LoopbackModelHelper('Chart'),
  ZoomLevel = new LoopbackModelHelper('ZoomLevel'),
  moment = require('moment'),
  settings = require('../server/util/get-settings'),
  time = require('../server/util/time'),
  collections = require('../server/util/collections'),
  _ = require('lodash');


const task = module.exports = {
  run(cb) {
    if (cb) cb(); // fire and forget
    settings(['map:maxZoom', 'zoomLevels:endDate', 'zoomLevels:intervalMins'], findZoomLevel);
  }
};

// start immediately if run as script
if (require.main === module) {
  task.run();
}

function findZoomLevel(settings) {
  // Sample minutes_ago from any zoom (all zooms have same time periods)
  ZoomLevel.find(
    {
      where: {zoom_level: settings['map:maxZoom']}, // all zoomlevels have same # of events
      order: 'minutes_ago ASC'
    },
    createChart(settings)
  );
}

function createChart(settings) {
  return (err, zoomLevels) => {
    if (err) {
      console.error(err);
      return;
    }

    let interval = settings['zoomLevels:intervalMins'] || 1440, // mins
      endDate = moment(settings['zoomLevels:endDate'] || moment()),
      firstPeriod = interval,
      lastPeriod = zoomLevels[zoomLevels.length - 1].minutes_ago,
      rows = [];

    for (let mins of collections.range(firstPeriod, lastPeriod, interval)) {
      // moments are mutable
      let date = endDate.clone().subtract(mins, 'minutes'),
        zoom = _(zoomLevels).detect(zoom => zoom.minutes_ago === mins),
        sandboxPostsCount = 0,
        hashtagPostsCount = 0;

      if (zoom) {
        let events = _(zoom.clusters).map('events').flatten();
        hashtagPostsCount = _(events)
          .filter(evt => evt.event_source === 'hashtag')
          .sum('weight');
        sandboxPostsCount = _(events)
          .filter(evt => evt.event_source === 'sandbox')
          .sum('weight');
      }
      rows.push([date.format('YYYY-MM-DD'), hashtagPostsCount, sandboxPostsCount]);
    }
    let chartData = {
      rows: rows,
      columns: [
        {'type': 'date', 'label': 'Date'},
        {'type': 'number', 'label': 'Hashtags'},
        {'type': 'number', 'label': 'Images'}
      ]
    };

    Chart.findOrCreate(
      { where: {name: 'time-series'} },
      {
        name: 'time-series',
        data: chartData
      },
      (err, chart) => {
        if (err) {
          console.error(err);
          return;
        }
        chart.data = chartData;
        chart.save();
        console.info('✔ Chart created')
      }
    );
  }
}
