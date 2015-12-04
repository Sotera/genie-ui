'use strict';

let app = require('../server/server'),
  ZoomLevel = app.models.ZoomLevel,
  StatsChip = app.models.StatsChip,
  log = require('debug')('task:events-stats'),
  ds = ZoomLevel.getDataSource();

// TODO: we need to query ES, not clustered events
ds.on('connected', function() {
  let zoomLevels = ds.connector.collection(ZoomLevel.modelName);

  zoomLevels.aggregate({
    $group: {
      _id: { created: "$created" },
      total: { $sum: 1 }
    }
  }, (err, results) => {
    if (err) throw err;
    console.log(results)

    createStats(results);
  });
});

function createStats(results) {
  // TODO: use mapping once we have more ES data
  // let rows = results.map((result,i) => ({"row": [ i, result.total ]}));
  let rows = [
    {row: ['11-25', 300]},
    {row: ['11-26', 200]},
    {row: ['11-27', 700]},
    {row: ['11-28', 500]},
    {row: ['11-29', 200]},
    {row: ['11-30', 600]}
  ];

  StatsChip.create({
    rows: rows,
    columns: [
      { "name": "Day", "type": "string" }, { "name": "Events", "type": "number" }
    ]
  }, (err, chip) => {
    if (err) throw err;
  });

}
