#!/usr/bin/env node
'use strict';

const app = require('../server/server'),
  LoopbackModelHelper = require('../server/util/loopback-model-helper'),
  Chart = new LoopbackModelHelper('Chart'),
  ZoomLevel = new LoopbackModelHelper('ZoomLevel'),
  log = require('debug')('task:chart:events'),
  moment = require('moment'),
  settings = require('../server/util/get-settings'),
  time = require('../server/util/time'),
  collections = require('../server/util/collections'),
  _ = require('lodash');


settings(['map:maxZoom', 'zoomLevels:endDate'], findZoomLevel);

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

    var endDate = moment(settings['zoomLevels:endDate'] || moment());

    var firstPeriod = zoomLevels[0].minutes_ago,
      lastPeriod = zoomLevels[zoomLevels.length - 1].minutes_ago,
      interval = 1440; // TODO: should be a setting

    var rows = [];

    for (var mins of collections.range(firstPeriod, lastPeriod, interval)) {
      // moments are mutable
      var date = endDate.clone().subtract(mins, 'minutes');
      var zoom = _(zoomLevels).detect(zoom => zoom.minutes_ago === mins);
      var clusterLength = 0;
      if (zoom) {
        clusterLength = _(zoom.clusters).sum('events.length');
      }
      rows.push([date.format('YYYY-MM-DD'), clusterLength]);
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
