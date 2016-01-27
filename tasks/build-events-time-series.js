#!/usr/bin/env node
'use strict';

const app = require('../server/server'),
  LoopbackModelHelper = require('../server/util/loopback-model-helper'),
  Chart = new LoopbackModelHelper('Chart'),
  ZoomLevel = new LoopbackModelHelper('ZoomLevel'),
  log = require('debug')('task:chart:events'),
  moment = require('moment'),
  settings = require('../server/util/get-settings'),
  time = require('../server/util/time');


settings(['map:maxZoom', 'zoomLevels:endDate'], findZoomLevel);

function findZoomLevel(settings) {
  // Sample minutes_ago from any zoom (all zooms have same time periods)
  ZoomLevel.find(
    {
      //settings['map:maxZoom']}
      where: {zoom_level: 10},
      order: 'minutes_ago ASC'
    },
    createChart(settings)
  );
}

function createChart(settings) {
  return (err, zoomLevels) => {
    if (err) {
      log(err);
      return;
    }

//    let endDate = moment(settings['zoomLevels:endDate'] || moment());
    let endDate = moment('2015-08-19' || moment());

    let rows = zoomLevels.map(zoomLevel => {
      // moments are mutable
      let date = endDate.clone().subtract(zoomLevel.minutes_ago, 'minutes');
      return [date.format('YYYY-MM-DD'), zoomLevel.clusters.length];
    });

    let chartData = {
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
          log(err);
          return;
        }
        chart.data = chartData;
        chart.save();
      }
    );
  }
}
