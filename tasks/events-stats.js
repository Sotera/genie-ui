'use strict';

let app = require('../server/server'),
  ClusteredEvent = app.models.ClusteredEvent,
  StatsChip = app.models.StatsChip,
  log = require('debug')('task:events-stats'),
  ds = ClusteredEvent.getDataSource();

  ds.on('connected', function() {
    let eventsCollection = ds.connector.collection(ClusteredEvent.modelName);

    eventsCollection.aggregate({
      $group: {
        _id: { created: "$created" },
        total: { $sum: 1 }
      }
    }, (err, results) => {
      if (err) throw err;
      console.log(results)

      createStats(results);
    });
  })

function createStats(results) {
  let rows = results.map((result,i) => ({"row": [ i, result.total ]}));

  StatsChip.create({
    rows: rows,
    columns: [
      { "name": "Day", "type": "number" }, { "name": "Events", "type": "number" }
    ]
  }, (err, chip) => {
    if (err) throw err;
  });

}
