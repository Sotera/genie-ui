var _        = require('underscore')._,
          es = require('elasticsearch');
var NewEventDetector = require('./events');

function Giver() {
  this.ned         = new NewEventDetector();
  this.index       = 'instagram_remap';
  this.scrape_name = 'hajj';
  this.event_client = new es.Client({hosts : ['http://52.90.177.87:9200/'],requestTimeout: 600000});

}

Giver.prototype.load_ned = function(start_date, end_date, cb) {
    var _this = this;

    this.ned.reset();

    if ( start_date == null || end_date == null ) {
      start_date = new Date('2010-01-01 01:00:00').getTime(); // before instagram existed.
      end_date = new Date().getTime();
    }
    start_date/=1000;
    end_date/=1000;

    var query = {
      "size"    : 3000,
      "_source" : ['id', 'created_time', 'location', 'sims'],
      "sort"    : [
        {
          "created_time": { "order": "asc" }
        }
      ],
      "query": {
        "range": {
          "created_time": {
            "from" : start_date,
            "to"   : (+ end_date + (24 * 60 * 60))
          }
        }
      }
    };

    this.event_client.search({
        index : 'events',
        type  : this.scrape_name,
        body  : query
    }).then(function(response) {
        console.log('load_ned :: got response');
        _.map(response.hits.hits, function(x) {
            _this.ned.update({
                'target'       : x['_source']['id'],
                'created_time' : x['_source']['created_time'],
                'location'     : x['_source']['location'],
                'cands'        : x['_source']['sims']
            })
        });

        cb({ 'events' : _this.ned.summarize() });
    }).catch(function(reason){
    console.log(reason);
  });
};

// ---- Helper functions -----

module.exports = Giver;
