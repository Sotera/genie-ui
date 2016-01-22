#!/usr/bin/env node
'use strict';

const jsonfile = require('jsonfile');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});
const outfile = 'sources.json';

client.search({
  index: 'sandbox',
  type: 'event',
  body: {
    query: { match_all: {} },
    size: 9999
  }
}, (err, results) => {
  if (err) throw err;

  var docs = results.hits.hits;

  jsonfile.writeFile(outfile, docs, err => {
    console.error(err)
  });
});
