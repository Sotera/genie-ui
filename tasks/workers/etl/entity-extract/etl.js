'use strict';

const moment = require('moment'),
  _ = require('lodash'),
  es = require('elasticsearch'),
  request = require('request-json'),
  sourcePath = 'http://54.174.131.124:3003/api/parsedevents',
  sourceClient = request.createClient(sourcePath),
  app = require('../../../../server/server'),
  //// if ES connector can create a mapping, we can remove es.Client
  EntityExtractSource = app.models.EntityExtractSource,
  esDestClient = new es.Client({
    host: 'elasticsearch:9200',
    requestTimeout: 60000,
    log: 'error'
  }),
  esDestIndex = 'entity-extract',
  esDestType = 'event',
  ////
  dataMapping = require('../../../../server/util/data-mapping'),
  eventMapping = dataMapping.getEventTypeMapping();
  ;

module.exports = {
  run: run
};

function run() {
  // dataMapping.createIndexWithMapping({
  //   client: esDestClient,
  //   mapping: eventMapping,
  //   index: esDestIndex,
  //   type: esDestType
  // })
  // .then(loadEvents)
  loadEvents()
  .then(() => console.log('done'))
  .catch(console.error);
}

function loadEvents() {
  return new Promise((resolve, reject) => {
    var startDate = moment().subtract(1, 'day').toISOString(); //just recent events
    var filter = '?filter[where][geocoded]=true&filter[where][created][gt]=' + startDate;
    sourceClient.get(sourcePath + filter,
      function(err, res, events) {
        if (err) reject(err);

        function invalidEvent(event) {
          return _.isEmpty(event.dates);
        }

        var validEvents = _.reject(events, invalidEvent);
        console.log('loading', validEvents.length, 'events');

        var createEvents = validEvents.map(event => {
          return EntityExtractSource.find(
            { where: { event_id: event.id } }
          )
          .then(src => {
            if (src && src.length) return console.log('event exists', event.id);

            return EntityExtractSource.create({
              event_id: event.id,
              num_posts: 1,
              event_source: 'entity-extract',
              indexed_date: new Date(),
              post_date: event.dates[0],
              lat: event.lat,
              lng: event.lng
            })
            .then(src => console.log('created event', src.event_id));
          })
        });

        Promise.all(createEvents).then(resolve);
      });
  });
}
