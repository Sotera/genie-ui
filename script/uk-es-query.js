#!/usr/bin/env node

'use strict';

// scroll ES docs
const es = require('elasticsearch');
const client = new es.Client({
    host: '10.1.92.76:9200',
    requestTimeout: 60000,
    log: 'error'
  }),
  index = 'qcr_gnip',
  type = '2016_01_tp'
  ;

const minLat = 51.50,
  minLng = -0.13,
  maxLat = 51.52,
  maxLng = -0.11
  ;

const fs = require('fs'),
  outfile = fs.createWriteStream('./tweets.json');

outfile.on('error', console.error);

const query = {
    // _source : ['id', 'postedTime', 'geo'],
    size    : 100,
    sort    : [
      {
        postedTime: { order: 'asc' }
      }
    ],
    query: {
      range: {
        postedTime: {
          from : '2015-06-20',
          to   : '2015-06-21'
        }
      }
    }
  };

let countDocs = 0;
client.search({
  index : index,
  type  : type,
  scroll: '5s',
  body  : query
})
.then(scroll)
.then(() => outfile.end())
.catch(console.error);

function scroll(res) {
  console.log('scrolling...', countDocs, 'documents');
  let src, coords, lat, lng, hits = res.hits.hits;

  hits.forEach(hit => {
    src = hit._source;
    if (!src.geo) return; // no geo value (there is one in location.geo but don't think we want it)
    coords = src.geo.coordinates;
    lat = coords[0];
    lng = coords[1];
    if (lat >= minLat && lat <=maxLat && lng >= minLng && lng <= maxLng) {
      console.log(src);
      outfile.write(JSON.stringify(src));
    }
  });
  countDocs += hits.length;

  if (res.hits.total > countDocs) {
    return client.scroll({
      scrollId: res._scroll_id,
      scroll: '5s'
    })
    .then(scroll)
    .catch(console.error);
  } else {
    return 'done';
  }
}
