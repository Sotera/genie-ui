'use strict';

let app = require('../server/server'),
  request = require('request'),
  StatsChip = app.models.StatsChip,
  log = require('debug')('task:events-stats'),
  ds = StatsChip.getDataSource();

// TODO: we need to query ES, not clustered events

ds.on('connected', function() {
  let statsAggObj = {
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

  request.post({
    url: 'http://172.21.10.140:9200/jag_hc2_clusters/post/_search',
    json: true,
    body: statsAggObj
  }, function (error, response, body) {
    if (response) {
      log(body);
      createStats(body);
    }
    else if (error) {
      log(error);
    }
  });
});

function createStats(results) {
  // TODO: use mapping once we have more ES data
  // let rows = results.map((result,i) => ({"row": [ i, result.total ]}));
  let rows = [];
  results.aggregations.event_stats.buckets.forEach(function(aggregation){
      rows.push([aggregation.key_as_string,aggregation.doc_count]);
    }
  );

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
