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
    log: 'error'
  }),
  esDestClient = new es.Client({
    host: 'localhost:9200',
    requestTimeout: 600000,
    log: 'error'
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
  console.log("You might want to go get some coffee or something.");
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

function getUrlFromNodeId(node){
  return new Promise(function(resolve,reject){
    giver.url_from_id(node.id,function(url){
      resolve({"nodeId":node.id,"url":url})
    });
  });
}

function convertEvent(sourceEvent, data){
  var destEvent = {
    id: sourceEvent.id,
    post_date: moment(sourceEvent.created_time).format('YYYY-MM-DD'),
    location: [sourceEvent.location.lat.min, sourceEvent.location.lon.min],
    event_source: esDestIndex,
    num_images: sourceEvent.count,
    extra: {
      network_graph: data.detail
    }
  };

  console.log("getting node image urls");
  Promise.all(data.detail.nodes.map(getUrlFromNodeId)).then(function(values){

    destEvent.extra['node_to_url'] = values;

    esDestClient.index({
      index: esDestIndex,
      type: 'event',
      id: destEvent.id,
      body: destEvent
    }, function (err, res) {
      if (err) {
        console.log(JSON.stringify(err));
        return;
      }
      console.log("added event to ES")
    });
  });
}

