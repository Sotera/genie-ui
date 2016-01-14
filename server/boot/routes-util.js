'use strict';
const log = require('debug')('boot:routes:util'),
  es = require('elasticsearch'),
  esClient = new es.Client({
    host : '52.91.192.62:9200',
    requestTimeout: 600000,
    log: 'trace'
  });

module.exports = function(app) {

  app.get('/util/permit-data/:id', function(req, res) {
    esClient.search({
      index: 'hackathon_records',
      type: 'post',
      body: {
        size: 9999,
        query: {
          match: {
            cluster_id: req.params.id
          }
        }
      }
    }, function (err, results) {
      if (err) {
        log(err);
        res.status(500).send(err.message);
        return;
      }

      var hits = results.hits.hits;
      var docs = hits.map(hit => {
        return hit._source;
      });
      res.send(docs);
    });

  });

};
