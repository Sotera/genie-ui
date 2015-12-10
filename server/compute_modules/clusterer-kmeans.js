'use strict';
//var log = require('debug')('compute_modules:clusterer-kmeans');
var kmeans = require('node-kmeans');
var apiCheck = require('api-check')({
  output: {
    prefix: 'compute_modules:clusterer-kmeans geoCluster ',
    docsBaseUrl: 'http://www.example.com/error-docs#'
  },
  verbose: false
});

module.exports = class {
  constructor() {
  }

  geoCluster(locsToCluster, numberOfClusters, cb) {
    apiCheck.warn([
      apiCheck.arrayOf(
        apiCheck.shape(
          {
            lat: apiCheck.number,
            lng: apiCheck.number
          })),
      apiCheck.number,
      apiCheck.func], arguments);
    var vectorToCluster = []
    locsToCluster.forEach(function (loc) {
      vectorToCluster.push([loc.lat, loc.lng]);
    });
    kmeans.clusterize(vectorToCluster, {k: numberOfClusters}, cb);
  }
}

