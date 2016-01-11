'use strict';

const app = require('../../../../server/server'),
  moment = require('moment'),
  Giver = require('./giver'),
  es = require('elasticsearch'),
  es_source_scrape = 'hajj',
  es_source_index = 'instagram_remap',
  es_dest_index = 'sandbox',
  es_dest_type = 'event',
  es_source_client = new es.Client({hosts : ['http://52.90.177.87:9200/'],requestTimeout: 600000}),
  es_dest_client = new es.Client({hosts : ['http://localhost:9200/']}),
  giver = new Giver(es_source_client, es_source_index, es_source_scrape );

module.exports = {
  run: run
};

function run() {
  var es_index_mapping = {"event": {
    "properties": {
      "post_date": {
        "type": "date",
          "format": "date_optional_time"
      },
      "indexed_date": {
        "type": "date",
          "format": "date_optional_time"
      }
    }
  }};

  es_dest_client.indices.create({index:es_dest_index},function(err,response){
    if(!err) {
      es_dest_client.indices.putMapping({
        index: es_dest_index,
        type: es_dest_type,
        body: es_index_mapping
      }, function (err, response) {
        if(err){
          console.log('error adding mapping: ' + JSON.stringify(err));
          return;
        }
        loadEventSourceData();
      });
    }
    else {
      loadEventSourceData();
    }
  });
}

function loadEventSourceData(){
  console.log("loading events");
  giver.load_ned(null,null,function(data){
    summarizeEvents(data);

  })
}

function summarizeEvents(data){
  console.log('summarizing event data');
  data.events.forEach(function(event){
    giver.show_ned(event.id,function(data){
      convertEvent(event,data);
    });
  });
}

function convertEvent(sourceEvent, data){
  console.log("converting " + sourceEvent.id);
  var destEvent = {
    'id':sourceEvent.id,
    'post_date': moment(sourceEvent.created_time).format('YYYY-MM-DD'),
    'location': [sourceEvent.location.lat.min, sourceEvent.location.lon.min],
    'event_source': es_dest_index,
    'num_images':sourceEvent.count,
    'extra':{'network_graph':data.detail}
  };

  es_dest_client.index({
    'index': es_dest_index,
    'type': 'event',
    'id': destEvent.id,
    'body': destEvent
  }, function (error, response) {
    console.log(JSON.stringify(error));
  });
}


