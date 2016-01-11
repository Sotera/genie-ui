#!/usr/bin/env node
'use strict';

var app = require('../server/server'),
  Chart = app.models.Chart,
  ZoomLevel = app.models.ZoomLevel,
  log = require('debug')('task:chart:events'),
  moment = require('moment'),
  settings = require('../server/util/get-settings'),
  time = require('../server/util/time');


settings(['map:maxZoom', 'zoomLevels:endDate'], findZoomLevel);

function findZoomLevel(settings) {
  ZoomLevel.find(
    { where: {zoomLevel: settings['map:maxZoom']} },
    createChart(settings)
  );
}

function createChart(settings) {
  return (err, zoomLevels) => {
    if (err) {
      log(err);
      return;
    }

    let endDate = moment(settings['zoomLevels:endDate'] || moment());

    let rows = zoomLevels.map(zoomLevel => {
      // moments are mutable
      let date = endDate.clone().subtract(zoomLevel.minutesAgo, 'minutes');
      return [date.format('YYYY-MM-DD'), zoomLevel.events.length];
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