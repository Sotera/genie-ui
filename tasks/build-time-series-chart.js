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

    var interval = settings['zoomLevels:intervalMins'] || 1440; // mins
    var endDate = moment(settings['zoomLevels:endDate'] || moment());

    var firstPeriod = interval,
      lastPeriod = zoomLevels[zoomLevels.length - 1].minutes_ago;

    var rows = [];

    for (var mins of collections.range(firstPeriod, lastPeriod, interval)) {
      // moments are mutable
      var date = endDate.clone().subtract(mins, 'minutes');
      var zoom = _(zoomLevels).detect(zoom => zoom.minutes_ago === mins);
      var itemCount = 0;
      if (zoom) {
        itemCount = _(zoom.clusters).map('events').flatten().sum('weight');
      }
      rows.push([date.format('YYYY-MM-DD'), itemCount]);
    }
    var chartData = {
      rows: rows,
      columns: [
        {"type": "date", "label": "Date"},
        {"type": "number", "label": "Events"}
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
