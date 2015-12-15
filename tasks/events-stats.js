#!/usr/bin/env node
'use strict';

let app = require('../server/server'),
  request = require('request'),
  StatsChip = app.models.StatsChip,
  ClusteredEventSource = app.models.ClusteredEventSource,
  log = require('debug')('task:events-stats'),
  ds = ClusteredEventSource.getDataSource();

ds.on('connected', function() {
  const statsAggObj = {
    "size":0,
    "aggregations" : {
      "event_stats" : {
        "date_histogram" : {
          "field" : "indexed_date",
          "interval" : "hour"
        }
      }
    }
  };

  const settings = ds.settings,
    host = settings.hosts[0],
    url = [host.protocol, '://', host.host, ':', host.port, '/'].join('') +
      [settings.index, settings.type, '_search'].join('/');

console.log(url)
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
  // TODO: use mapping once we have more ES data
  // let rows = results.map((result,i) => ({"row": [ i, result.total ]}));
  let rows = results.aggregations.event_stats.buckets.map(function(aggregation){
    return [aggregation.key_as_string,aggregation.doc_count];
  });

  StatsChip.destroyAll();

  StatsChip.create({
    rows: rows,
    columns: [
      { "name": "Day", "type": "date" }, { "name": "Events", "type": "number" }
    ]
  }, (err, chip) => {
    if (err) throw err;
  });

}
