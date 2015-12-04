'use strict';
var log = require('debug')('boot:routes');
var clusteringInProgress = false;
module.exports = function (app) {
  app.post('/clusterEvents', function (req, res) {
    var r = req;
    if (clusteringInProgress) {
      res.status(200).end('Already Clustering Them! Patience!');
    } else {
      clusteringInProgress = true;
      var ClusteredEvent = app.models.ClusteredEvent;
      var ClusteredEventSource = app.models.ClusteredEventSource;

      ClusteredEvent.deleteAll();
      ClusteredEventSource.find(function (err, ces) {
        var v = [];
        for (var i = 0; i < ces.length; ++i) {
          ces[i]['lat'] = ces[i].location.coordinates[1];
          ces[i]['lon'] = ces[i].location.coordinates[0];
          v[i] = [ces[i]['lat'], ces[i]['lon']];
        }
        var kmeans = require('node-kmeans');
        kmeans.clusterize(v, {k: 4}, function (err, clusters) {
          if (err) {
            log('Clustering Error: ' + err);
            clusteringInProgress = false;
            return;
          }
          //Clustering worked, let's add them to ClusteredEvents
          var async = require('async');
          var findOrCreateObj = require('../util/findOrCreateObj');
          var newClusteredEvents = [];
          for (var k = 1; k <= 18; ++k) {
            log('Clustering Zoom Level: ' + k);
            for (var i = 0; i < clusters.length; ++i) {
              var coordinates = [];
              //for (var j = 0; j < clusters[i].cluster.length; ++j) {
              for (var j = 0; j < 1; ++j) {
                coordinates.push({
/*                  lat: clusters[i].cluster[j][0],
                  lng: clusters[i].cluster[j][1]*/
                  lat: clusters[i].centroid[0],
                  lng: clusters[i].centroid[1]
                });
              }
              newClusteredEvents.push(
                {
                  zoomLevel: k,
                  startTime: new Date(),
                  endTime: new Date(),
                  clusterType: 'Random',
                  coordinates,
                  centerPoint: {lat: clusters[i].centroid[0], lng: clusters[i].centroid[1]}
                }
              );
            }
          }
          var functionArray = [];
          newClusteredEvents.forEach(function (newClusteredEvent) {
            functionArray.push(async.apply(findOrCreateObj,
              ClusteredEvent,
              {where: {uuid: 'dummy'}},
              newClusteredEvent));
          });
          async.parallel(functionArray, function (err) {
            if (err) {
              log('Error inserting Clustered Events: ' + err);
            } else {
              log('Clustering Complete!');
            }
            clusteringInProgress = false;
          });
        });
      });
      res.status(200).end('Clustering Them!');
    }
  });

  app.get('/addSomeClusteredEvents', function (req, res) {
    const tags = [
      'disney',
      'waltdisneyworld',
      'wdw',
      'northbrook',
      'me',
      'miamibeach'
    ];
    const centerCoords = [-80, 25];
    var ClusteredEventSource = app.models.ClusteredEventSource;

    var newClusteredEventSources = [];
    log('Loading up the dummy ClusteredEventSources, Baby!');
    var async = require('async');
    var findOrCreateObj = require('../util/findOrCreateObj');
    var Random = require('random-js');
    var random = new Random(Random.engines.mt19937().autoSeed())
    for (var i = 0; i <= random.integer(5, 10); i++) {
      newClusteredEventSources.push(
        {
          num_users: random.integer(5, 15),
          indexed_date: new Date(),
          post_date: new Date(),
          tag: tags[random.integer(0, tags.length - 1)],
          num_posts: random.integer(15, 45),
          location: {
            type: 'point',
            coordinates: [
              centerCoords[0] + random.real(-5, 5),
              centerCoords[1] + random.real(-5, 5)
            ]
          }
        }
      );
    }
    var functionArray = [];
    newClusteredEventSources.forEach(function (newClusteredEventSource) {
      functionArray.push(async.apply(findOrCreateObj,
        ClusteredEventSource,
        {where: {tag: 'dummy'}},
        newClusteredEventSource));
    });
    async.parallel(functionArray, function (err) {
      if (err) {
        log(err);
      }
      res.status(200).end('Created ' + functionArray.length + ' new ClusteredEventSources!');
    });
  });
}
