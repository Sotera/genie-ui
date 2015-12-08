'use strict';
if (require('cluster').isMaster) {
  return;
}
var log = require('debug')('boot:routes');
var kmeans = require('node-kmeans');
var async = require('async');
var findOrCreateObj = require('../util/findOrCreateObj');
var clusteringInProgress = false;
const clustersPerZoomLevel = [
  1024, 1024, 1024, 512, 512, 512, 256, 256, 256, 128, 128, 128, 64, 64, 32, 16, 8, 1
];
module.exports = function (app) {
  var ZoomLevel = app.models.ZoomLevel;
  var ClusteredEventSource = app.models.ClusteredEventSource;
  app.post('/clusterEventsEx', function (req, res) {
    //ZoomLevel.deleteAll();return;
    var zoomLevel = req.body.zoomLevel;
    var msg = 'Clustering @ zoomLevel: ' + zoomLevel;
    msg += ' [' + clustersPerZoomLevel[zoomLevel] + '] clusters.';
    res.status(200).end(msg);
    async.waterfall([
      function (next) {
        //Step 0-0 -> Get the clustered event sources from ES
        ClusteredEventSource.find(function (err, ces) {
          var vectorToCluster = [];
          for (var i = 0; i < ces.length; ++i) {
            ces[i]['lat'] = ces[i].location.coordinates[1];
            ces[i]['lon'] = ces[i].location.coordinates[0];
            vectorToCluster[i] = [ces[i]['lat'], ces[i]['lon']];
          }
          next(null, vectorToCluster);
        });
      },
      function (vectorToCluster, next) {
        kmeans.clusterize(vectorToCluster, {k: clustersPerZoomLevel[zoomLevel]}, function (err, clusters) {
          addClusteredEventsToDB(clusters, zoomLevel, function () {
            next();
          });
        });
      }
    ], function (err) {
    });
  });

  app.post('/clusterEvents', function (req, res) {
    if (clusteringInProgress) {
      res.status(200).end('Already Clustering Them! Patience!');
    } else {
      res.status(200).end('Test! Remove Me!');
      async.waterfall([
        function (next) {
          //Step 0-0 -> Get the clustered event sources from ES
          ClusteredEventSource.find(function (err, ces) {
            var vectorToCluster = [];
            for (var i = 0; i < ces.length; ++i) {
              ces[i]['lat'] = ces[i].location.coordinates[1];
              ces[i]['lon'] = ces[i].location.coordinates[0];
              vectorToCluster[i] = [ces[i]['lat'], ces[i]['lon']];
            }
            next(null, vectorToCluster);
          });
        },
        function (vectorToCluster, next) {
          //Step 0-1 -> Waterfall through the 18 Google map zoom levels reclustering the results of
          //the previous clustering cycle

          //Delete the entire Clustered event collection
          ZoomLevel.deleteAll();
          var recursiveClusteringFunctionArray = [
            //Seed the waterfall with the event sources from ES
            function (next) {
              kmeans.clusterize(vectorToCluster, {k: clustersPerZoomLevel[0]}, function (err, clusters) {
                next(err, clusters, 1);
              });
            }
          ];
          //Define function to calculate sub clusters
          function subClusteringFunction(clusters, zoomLevel, next) {
            var newClusteredEvents = [];
            var coordinates = [];
            for (var i = 0; i < clusters.length; ++i) {
              coordinates.push({
                lat: clusters[i].centroid[0],
                lng: clusters[i].centroid[1]
              });
            }
            log(clustersPerZoomLevel.length - zoomLevel);
            newClusteredEvents.push(
              {
                //zoomLevel,
                zoomLevel: clustersPerZoomLevel.length - zoomLevel,
                startTime: new Date(),
                endTime: new Date(),
                clusterType: 'Random',
                coordinates,
                centerPoint: {lat: 20, lng: -80}
              }
            );
            var functionArray = [];
            newClusteredEvents.forEach(function (newClusteredEvent) {
              functionArray.push(async.apply(findOrCreateObj,
                ZoomLevel,
                {where: {uuid: 'dummy'}},
                newClusteredEvent));
            });
            async.parallel(functionArray, function (err) {
              if (err) {
                log('Error inserting Clustered Events: ' + err);
                next(null);
              } else {
                var vectorToCluster = [];
                clusters.forEach(function (cluster) {
                  vectorToCluster.push([cluster.centroid[0], cluster.centroid[1]]);
                });
                kmeans.clusterize(vectorToCluster, {k: clustersPerZoomLevel[zoomLevel]}, function (err, clusters) {
                  next(err, clusters, zoomLevel + 1);
                });
                log('Clusters added for zoom level' + zoomLevel + ' Complete!');
              }
            });
          }

          //Load up an array of the subClusteringFunction for use in the async.waterfall method
          for (var i = 1; i < clustersPerZoomLevel.length; ++i) {
            recursiveClusteringFunctionArray.push(subClusteringFunction);
          }
          async.waterfall(recursiveClusteringFunctionArray, function (err) {
            if (err) {
              log(err);
            }
            next(null);
          });
        }
      ], function (err) {
        clusteringInProgress = false;
      });
      clusteringInProgress = true;
      res.status(200).end('Clustering Them!');
    }
  });

  function addClusteredEventsToDB(clusters, zoomLevel, cb) {
    if(!clusters){
      log('Clusters is undefined ...');
      cb();
      return;
    }
    ZoomLevel.destroyAll({zoomLevel: zoomLevel}, function (err, destroyRes) {
      if(err){
        log('Error destroying zoomLevel: ' + zoomLevel);
        return;
      }
      log('Destroyed ZoomLevel: ' + zoomLevel);
      var newClusteredEvents = [];
      var coordinates = [];
      for (var i = 0; i < clusters.length; ++i) {
        coordinates.push({
          lat: clusters[i].centroid[0],
          lng: clusters[i].centroid[1]
        });
      }
      log(clustersPerZoomLevel.length - zoomLevel);
      newClusteredEvents.push(
        {
          //zoomLevel,
          zoomLevel: clustersPerZoomLevel.length - zoomLevel,
          startTime: new Date(),
          endTime: new Date(),
          clusterType: 'Random',
          events: coordinates,
          centerPoint: {lat: 20, lng: -80}
        }
      );
      var functionArray = [];
      newClusteredEvents.forEach(function (newClusteredEvent) {
        functionArray.push(async.apply(findOrCreateObj,
          ZoomLevel,
          {where: {uuid: 'dummy'}},
          newClusteredEvent));
      });
      async.parallel(functionArray, function (err) {
        if (err) {
          log('Error inserting Clustered Events: ' + err);
        }
        cb(null);
      });
    });
  }

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
    for (var i = 0; i <= random.integer(20, 50); i++) {
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

