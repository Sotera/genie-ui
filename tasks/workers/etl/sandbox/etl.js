'use strict';

const moment = require('moment'),
  es = require('elasticsearch'),
  esSourceType = 'greenville',
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
    log: 'trace'
  }),
  Giver = require('./giver'),
  giver = new Giver(esSourceClient, esSourceIndex, esSourceType),
  dataMapping = require('../../../../server/util/data-mapping'),
  eventMapping = dataMapping.getEventTypeMapping();

module.exports = {
  run: run
};

function run() {
  esDestClient.indices.exists({index: esDestIndex})
  .then(exists => {
    // TODO: rm delete() in prod
    // delete if exists
    return (exists ? esDestClient.indices.delete({index: esDestIndex}) : exists);
  })
  .then(() => esDestClient.indices.create({index: esDestIndex}))
  .then(() => {
    return esDestClient.indices.putMapping({
      index: esDestIndex,
      type: esDestType,
      body: eventMapping
    });
  })
  .then(loadEvents)
  .catch(console.error);
}

function loadEvents() {
  console.log("loading events");
  console.log("You might want to go get some coffee or something.");
  giver.load_ned()
  .then(summarizeEvents)
  .catch(console.error);
}

function summarizeEvents(data){
  if (!data.events || data.events.length == 0)
    throw new Error('Expected to find sandbox events');

  console.log('summarizing event data');
  data.events.forEach(function(event){
    giver.show_ned(event.id, function(data) {
      convertEvent(event,data);
    });
  });
}

function getUrlFromNodeId(node){
  return new Promise(function(resolve,reject) {
    giver.url_from_id(node.id,function(url) {
      resolve({nodeId: node.id, url: url});
    });
  });
}

function convertEvent(sourceEvent, data){
  var created = moment(sourceEvent.created_time).format('YYYY-MM-DD');
  var destEvent = {
    event_id: sourceEvent.id,
    event_source: esDestIndex,
    indexed_date: created,
    post_date: new Date(sourceEvent.created_time.min * 1000),
    lat: sourceEvent.location.lat.min,
    lng: sourceEvent.location.lon.min,
    network_graph: data.detail,
    num_posts: sourceEvent.count
  };

  console.log("getting node image urls");
  Promise.all(data.detail.nodes.map(getUrlFromNodeId))
  .then(function(nodes){

    destEvent.node_to_url = nodes;

    esDestClient.index({
      index: esDestIndex,
      type: esDestType,
      id: destEvent.id,
      body: destEvent
    }, function (err, res) {
      if (err) {
        console.log(JSON.stringify(err));
        return;
      }
      console.log("added event to ES")
    });
  })
  .catch(console.error);
}

