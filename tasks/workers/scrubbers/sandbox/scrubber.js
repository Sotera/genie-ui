'use strict';

const app = require('../../../../server/server'),
  moment = require('moment'),
  Giver = require('./giver'),
  es = require('elasticsearch'),
  esSourceType = 'hajj',
  esSourceIndex = 'instagram_remap',
  esDestIndex = 'sandbox',
  esDestType = 'event',
  esSourceClient = new es.Client({
    host: '52.90.177.87:9200',
    requestTimeout: 600000,
    log: 'trace'
  }),
  esDestClient = new es.Client({
    host: 'localhost:9200',
    log: 'trace'
  }),
  giver = new Giver(esSourceClient, esSourceIndex, esSourceType);

module.exports = {
  run: run
};

function run() {
  var eventMapping = {
    "event": {
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
    }
  };

  // TODO: rm delete() in prod
  esDestClient.indices.delete({index:esDestIndex}, function(err,res){
    esDestClient.indices.create({index:esDestIndex}, function(err,res){
      if(!err) {
        esDestClient.indices.putMapping({
          index: esDestIndex,
          type: esDestType,
          body: eventMapping
        }, function(err, res) {
          if(err){
            console.log('error adding mapping: ' + JSON.stringify(err));
            return;
          }
          loadEventSourceData();
        });
      } else {
        loadEventSourceData();
      }
    });
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
    giver.show_ned(event.id, function(data) {
      convertEvent(event,data);
    });
  });
}

function convertEvent(sourceEvent, data){
  console.log('converting ' + sourceEvent.id);
  var destEvent = {
    id: sourceEvent.id,
    post_date: moment(sourceEvent.created_time).format('YYYY-MM-DD'),
    location: [sourceEvent.location.lat.min, sourceEvent.location.lon.min],
    event_source: esDestIndex,
    num_images: sourceEvent.count,
    extra: {network_graph: data.detail}
  };

  esDestClient.index({
    index: esDestIndex,
    type: 'event',
    id: destEvent.id,
    body: destEvent
  }, function (err, res) {
    if (err)
      console.log(JSON.stringify(err));
  });
}


