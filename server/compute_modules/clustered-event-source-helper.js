'use strict';
//var log = require('debug')('compute_modules:clustered-event-source-helper');
var createObj = require('../util/createObj');
var async = require('async');
var Random = require('random-js');
var random = new Random(Random.engines.mt19937().autoSeed());
var apiCheck = require('api-check')({
  output: {
    prefix: 'compute_modules:clustered-event-source-helper',
    docsBaseUrl: 'http://www.example.com/error-docs#'
  },
  verbose: false
});
const randomishTags = [
  'disney',
  'waltdisneyworld',
  'wdw',
  'northbrook',
  'me',
  'miamibeach'
];
const randomishPointsOnEarth = [
  {lat: 30.25, lng: -97.5}//Austin
  , {lat: 41.8, lng: -87.67}//Chicago
  , {lat: 39.75, lng: -104.9}//Denver
  , {lat: 25.75, lng: -80.2}//Miami
];
var randomishNumPosts = [];
for (var i = 0; i < random.integer(5, 50); ++i) {
  randomishNumPosts.push(random.integer(5, 50))
}
var randomishNumUsers = [];
for (var i = 0; i < random.integer(5, 50); ++i) {
  randomishNumUsers.push(random.integer(5, 50))
}
module.exports = class {
  constructor(app) {
    this.ClusteredEventSource = app.models.ClusteredEventSource;
  }

  initialize(cb) {
    this.ClusteredEventSource.deleteAll(cb);
  }

  getAllForClustererInput(cb) {
    apiCheck.warn([apiCheck.func], arguments);
    this.ClusteredEventSource.find(function (err, ces) {
      if (err) {
        cb(err, null);
        return;
      }
      var vectorToCluster = [];
      for (var i = 0; i < ces.length; ++i) {
        vectorToCluster[i] = {lat: ces[i].location.coordinates[1], lng: ces[i].location.coordinates[0]};
      }
      cb(err, vectorToCluster);
    });
  }

  addClusteredEventSources(options, cb) {
    var ClusteredEventSource = this.ClusteredEventSource;
    options = options || {};
/*    apiCheck.warn([apiCheck.shape({
      clusterCountMin: apiCheck.number
      , clusterCountMax: apiCheck.number
      , tags: apiCheck.arrayOf(apiCheck.number)
      , numUsers: apiCheck.arrayOf(apiCheck.number)
      , numPosts: apiCheck.arrayOf(apiCheck.number)
      , locCenters: apiCheck.arrayOf(
        apiCheck.shape(
          {
            lat: apiCheck.number,
            lng: apiCheck.number
          }))
      , distFromCenterMin: apiCheck.number
      , distFromCenterMax: apiCheck.number
    }).optional, apiCheck.func], arguments);*/
    if ((arguments.length === 0) ||
      (arguments.length === 1 && typeof arguments[0] !== 'function') ||
      (arguments.length >= 2 && typeof arguments[1] !== 'function')) {
      throw new Error('Syntax: addClusteredEventSources([options], callback)');
    }
    //Setup some defaults for options
    options.clusterCountMin = options.clusterCountMin || 30;
    options.clusterCountMax = options.clusterCountMax || 75;
    options.tags = options.tags || randomishTags;
    options.numUsers = options.numUsers || randomishNumUsers;
    options.numPosts = options.numPosts || randomishNumPosts;
    options.locCenters = options.locCenters || randomishPointsOnEarth;
    options.distFromCenterMin = options.distFromCenterMin || 0.05;
    options.distFromCenterMax = options.distFromCenterMax || 0.5;
    options.postDate = options.postDate || new Date();
    options.indexedDate = options.indexedDate || new Date();

    var clusterCount = random.integer(options.clusterCountMin, options.clusterCountMax);
    var newClusteredEventSources = [];
    for (var i = 0; i <= clusterCount; i++) {
      var idx = random.integer(0, options.locCenters.length - 1);
      var r = random.real(options.distFromCenterMin, options.distFromCenterMax);
      var theta = random.real(0, Math.PI * 2);
      var lat = options.locCenters[idx]['lat'] + (r * Math.cos(theta));
      var lng = options.locCenters[idx]['lng'] + (r * Math.sin(theta));
      newClusteredEventSources.push(
        {
          num_users: options.numUsers[random.integer(0, options.numUsers.length - 1)],
          indexed_date: options.indexedDate,
          post_date: options.postDate,
          tag: options.tags[random.integer(0, options.tags.length - 1)],
          num_posts: options.numPosts[random.integer(0, options.numPosts.length - 1)],
          location: {
            type: 'point',
            coordinates: [lng, lat]
          }
        }
      );
    }
    var functionArray = [];
    newClusteredEventSources.forEach(function (newClusteredEventSource) {
      functionArray.push(async.apply(createObj,
        ClusteredEventSource,
        newClusteredEventSource));
    });
    async.parallel(functionArray, cb);
  }
}

