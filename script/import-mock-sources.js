#!/usr/bin/env node
'use strict';

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace',
  requestTimeout: 300000
});
var type = 'event';
var dataMapping = require('../server/util/data-mapping');
var eventMapping = dataMapping.getEventTypeMapping();

var sources = [
  {indexName: 'sandbox', path: '../import/sandbox/sources.json'},
  {indexName: 'hashtags', path: '../import/hashtags/ferguson-sources.json'}
];

sources.forEach(src => {
  // Create index and add type mapping
  client.indices.delete({index: src.indexName, ignore:[404]}, (err, res) => {
    if (err) throw err;
    // why ignore 400? b/c ES says index exists. not sure why...
    client.indices.create({index: src.indexName, ignore:[400]}, (err, res) => {
      if (err) throw err;
      client.indices.putMapping({
        index: src.indexName,
        type: type,
        body: eventMapping
      }, function(err, res) {
        if (err) throw err;
        console.log(res)
        bulkLoad(src);
      });
    });
  });
});

function bulkLoad(src) {
  const sourceDocs = require(src.path);

  let bulkCmds = [];
  sourceDocs.forEach(doc => {
    bulkCmds.push({ create: {} });
    bulkCmds.push(doc._source || doc); // includes meta fields or only source doc
  });

  client.bulk({
    index: src.indexName,
    type: type,
    body: bulkCmds
  }, (err, res) => {
    if (err) throw err;
    // console.log(res);
  });
}
