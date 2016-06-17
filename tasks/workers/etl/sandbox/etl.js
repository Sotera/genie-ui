'use strict';

const moment = require('moment'),
  es = require('elasticsearch'),
  esSourceType = '20150620-london2',
  esSourceIndex = 'instagram_remap',
  esDestIndex = 'sandbox',
  esDestType = 'event',
  esSourceClient = new es.Client({
    host: '52.90.177.87:9200',
    requestTimeout: 600000,
    log: 'error'
  }),
  esDestClient = new es.Client({
    host: 'elasticsearch:9200',
    requestTimeout: 600000,
    log: 'error'
  }),
  Giver = require('./giver'),
  giver = new Giver(esSourceClient, esSourceIndex, esSourceType),
  dataMapping = require('../../../../server/util/data-mapping'),
  eventMapping = dataMapping.getEventTypeMapping(),
  _ = require('lodash');

module.exports = {
  run: run
};

function run() {
  dataMapping.createIndexWithMapping({
    client: esDestClient,
    mapping: eventMapping,
    index: esDestIndex,
    type: esDestType
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
  if (!data.events || !data.events.length)
    throw new Error('Expected to find sandbox events');

  console.log('summarizing event data');
  data.events.forEach(function(event){
    giver.show_ned(event.id, function(data) {
      convertEvent(event, data);
    });
  });
}

function getPostDetails(node){
  return new Promise(function(resolve, reject) {
    giver.details_for_post_id(node.id, function(obj) {
      var details = _.extend({ nodeId: node.id }, obj);
      resolve(details);
    });
  });
}

// build 2-dimension array of items per hour
function buildTimeSeries(nodes){
  try {
    var dateMap = {}, timeseries = [],
      date, firstDate, lastDate, dateToHour;

    nodes.forEach(node => {
      date = new Date(node.time * 1000);
      if(!firstDate || node.time < firstDate){
        firstDate = node.time;
      }
      if(!lastDate || node.time > lastDate){
        lastDate = node.time;
      }
      dateToHour = new Date(date.getFullYear(), date.getMonth(),
        date.getDate(), date.getHours());
      if (dateMap[dateToHour]) {
        dateMap[dateToHour][1]++;
      } else {
        dateMap[dateToHour] = [dateToHour.getTime(), 1];
      }
    });
    timeseries = _.values(dateMap);

    // TODO: using lastDate b/c it seems to give the 'correct'
    // day (in the UI) altho i haven't fully vetted this.
    return {
      post_date: moment(lastDate * 1000).toDate(),
      timeseries: {
        rows: timeseries,
        columns: [
          {label: "Date", type: "date"},
          {label: "Images", type: "number"}
        ]
      }
    };
  } catch(ex) {
    console.error(ex);
  }
}

function convertEvent(sourceEvent, data){
  var created = moment(sourceEvent.created_time.min).format('YYYY-MM-DD');
  var location = sourceEvent.location;
  var destEvent = {
    event_id: sourceEvent.id,
    event_source: esDestIndex,
    indexed_date: created, // prolly not the actual indexed date?
    lat: location.lat.min,
    lng: location.lon.min,
    bounding_box: {
      sw: {
        lat: location.lat.min,
        lng: location.lon.min
      },
      ne: {
        lat: location.lat.max,
        lng: location.lon.max
      }
    },
    network_graph: data.detail,
    num_posts: sourceEvent.count
  };

  var timeSeriesData = buildTimeSeries(destEvent.network_graph.nodes);
  destEvent.post_date = timeSeriesData.post_date;
  destEvent.timeseries_data = timeSeriesData.timeseries;

  console.log("getting node image urls");
  Promise.all(data.detail.nodes.map(getPostDetails))
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
