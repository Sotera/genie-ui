'use strict';

var _        = require('underscore')._,
          es = require('elasticsearch');
var NewEventDetector = require('./events');

function Giver(es_source_client, es_source_index, es_source_scrape) {
  this.ned         = new NewEventDetector();
  this.index       = es_source_index;
  this.scrape_name = es_source_scrape;
  this.event_client = es_source_client;

}

Giver.prototype.load_ned = function(start_date, end_date) {
  var _this = this;

  this.ned.reset();

  if ( start_date == null || end_date == null ) {
    start_date = new Date('2010-01-01 01:00:00').getTime(); // before instagram existed.
    end_date = new Date().getTime();
  }
  start_date/=1000;
  end_date/=1000;

  // 10,000 max. TODO: run in batches
  var query = {
    size    : 10000,
    _source : ['id', 'created_time', 'location', 'sims'],
    sort    : [
      {
        created_time: { order: 'asc' }
      }
    ],
    query: {
      range: {
        created_time: {
          from : start_date,
          to   : (+ end_date + (24 * 60 * 60))
        }
      }
    }
  };

  return this.event_client.search({
    index : 'events',
    type  : this.scrape_name,
    body  : query
  })
  .then(function(res) {
    console.log('load_ned :: got response');
    _.map(res.hits.hits, function(hit) {
      _this.ned.update({
        target       : hit['_source']['id'],
        created_time : hit['_source']['created_time'],
        location     : hit['_source']['location'],
        cands        : hit['_source']['sims']
      });
    });

    return { events: _this.ned.summarize() };
  })
};

Giver.prototype.show_ned = function(cluster_id, cb) {
  var _this = this;

  var query = {
    "size"  : 999,
    "query" : {
      "terms" : {
        "_id" : this.ned.cluster_to_id[cluster_id]
      }
    }
  };

  this.event_client.search({
    index : 'events',
    type  : this.scrape_name,
    body  : query
  }).then(function(response) {
    _this.ned.set_detail(_.pluck(response.hits.hits, '_source'));

    cb({
      'detail' : _this.ned.make_graph(response.hits.hits)
    });
  });

};

Giver.prototype.url_from_id = function(id, cb) {

  var query = {
    "_source" : ["images.low_resolution.url", "location"],
    "query"   : {  "match" : { "id" : id } }
  };

  this.event_client.search({
    index : this.index,
    type  : this.scrape_name,
    body  : query
  }).then(function(response) {
    var hit = response.hits.hits[0];
    cb(hit._source.images.low_resolution.url);
    /*{
      'loc' : {
        'lat' : hit._source.location.latitude,
        'lon' : hit._source.location.longitude
      },
      'img_url' : hit._source.images.low_resolution.url,
      'id'      : hit._source.id
    });*/
  },function(err){
    console.log(err);
  });
};

module.exports = Giver;
