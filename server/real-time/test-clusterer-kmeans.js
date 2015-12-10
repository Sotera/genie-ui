'use strict';
var Clusterer = require('../compute_modules/clusterer-kmeans');
var clusterer = new Clusterer();
var Random = require('random-js');

const randomishPointsOnEarth = [
  {lat: 30.25, lng: -97.5}
  , {lat: 41.8, lng: -87.67}
  , {lat: 39.75, lng: -104.9}
  , {lat: 25.75, lng: -80.2}
];

var random = new Random(Random.engines.mt19937().autoSeed())
var locsToCluster = [];
for (var i = 0; i <= random.integer(30, 75); i++) {
  var idx = random.integer(0, randomishPointsOnEarth.length - 1);
  var r = random.real(0.05, 0.5);
  var theta = random.real(0, Math.PI * 2);
  var lat = randomishPointsOnEarth[idx]['lat'] + (r * Math.cos(theta));
  var lng = randomishPointsOnEarth[idx]['lng'] + (r * Math.sin(theta));
  locsToCluster.push(
    {
      lat, lng
    }
  );
}

var numberOfClusters = random.integer(4, 8);
clusterer.geoCluster(locsToCluster, numberOfClusters, function (err, clusters) {
  if(err){
    console.log('K-Means cluster failed: ' + err);
  }else{
    var msg = 'K-Means cluster succeeded.';
    msg +=  ' Cluster count: ' + clusters.length;
    console.log(msg);
    console.log('Centroids:');
    clusters.forEach(function(cluster){
      console.log(cluster.centroid);
    });
  }
});

