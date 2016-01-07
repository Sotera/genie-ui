#!/usr/bin/env node
'use strict';

let app = require('../server/server'),
  request = require('request'),
  InstagramSource = app.models.InstagramSource,
  Chart = app.models.Chart,
  log = require('debug')('task:chart:instagram'),
  ds = InstagramSource.getDataSource();

ds.on('connected', function() {
  const statsAggObj = {
    "size":0,
    "aggregations" : {
      "instagram_stats" : {
        "date_histogram" : {
          "field" : "created_time",
          "interval" : "day"
        }
      }
    }
  };

  const settings = ds.settings,
    host = settings.hosts[0],
    url = [host.protocol, '://', host.host, ':', host.port, '/'].join('') +
      [settings.index, settings.type, '_search'].join('/');

  request.post({
    url: url,
    json: true,
    body: statsAggObj
  }, (err, res, body) => {
    if (res) {
      log(body);
      createStats(body);
    } else if (err) {
      throw err;
    }
  });
});

function createStats(results) {
  // key is unix (epoch) time.
  let rows = results.aggregations.instagram_stats.buckets
    .map(agg => [new Date(+agg.key), agg.doc_count]);

  let chartData = {
    rows: rows,
    columns: [
      {"type": "date", "label": "Date"},
      {"type": "number", "label": "Images"}
    ]
  };

  Chart.findOrCreate(
    { where: {name: 'instagram-time-series'} },
    {
      name: 'instagram-time-series',
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
