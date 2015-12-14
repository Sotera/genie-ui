'use strict';
//var log = require('debug')('compute_modules:clusterer-kmeans');
var kmeans = require('node-kmeans');

module.exports = class {
  constructor() {
  }

  geoCluster(locsToCluster, numberOfClusters, cb) {
    var vectorToCluster = []
    locsToCluster.forEach(function (loc) {
      vectorToCluster.push([loc.lat, loc.lng]);
    });
    kmeans.clusterize(vectorToCluster, {k: numberOfClusters}, cb);
  }
}

