'use strict';
//var log = require('debug')('compute_modules:clustered-event-source-helper');
var createObj = require('../util/create-obj');
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
module.exports = class {
  constructor(app) {
    this.ClusteredEventSource = app.models.ClusteredEventSource;
  }

  initialize(cb) {
    this.ClusteredEventSource.deleteAll(cb);
  }

  randomDate(start, end) {
    return new Date(start.getTime() + random.real(0, 1, false) * (end.getTime() - start.getTime()));
  }

  getAllForClustererInput(options, cb) {
    if ((arguments.length === 1 && typeof arguments[0] !== 'function') ||
      (arguments.length >= 2 && typeof arguments[1] !== 'function')) {
      throw new Error('Syntax: addClusteredEventSources([options], callback)');
    }
    if (arguments.length === 1) {
      cb = arguments[0];
    }
    var startDate = new Date(2014, 10, 1);
    var endDate = new Date(2014, 10, 31)

    this.ClusteredEventSource.find({
      where: {
        post_date: {between: [startDate, endDate]}
      }
    }, function (err, ces) {
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
    var now = new Date();
    var sixMonthsAgo = new Date(new Date(now).setMonth(now.getMonth() - 6));
    options.clusterCountMin = options.clusterCountMin || 30;
    options.clusterCountMax = options.clusterCountMax || 75;
    options.tags = options.tags || randomishTags;
    options.maxNumUsers = options.maxNumUsers || 35;
    options.minNumUsers = options.minNumUsers || 5;
    options.maxNumPosts = options.maxNumPosts || 35;
    options.minNumPosts = options.minNumPosts || 5;
    options.locCenters = options.locCenters || randomishPointsOnEarth;
    options.distFromCenterMin = options.distFromCenterMin || 0.05;
    options.distFromCenterMax = options.distFromCenterMax || 0.5;
    options.maxPostDate = options.maxPostDate || now;
    options.minPostDate = options.minPostDate || sixMonthsAgo;
    options.maxIndexDate = options.maxIndexDate || now;
    options.minIndexDate = options.minIndexDate || sixMonthsAgo;

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
          num_users: random.integer(options.minNumUsers, options.maxNumUsers),
          num_posts: random.integer(options.minNumPosts, options.maxNumPosts),
          indexed_date: this.randomDate(options.minIndexDate, options.maxIndexDate),
          post_date: this.randomDate(options.minPostDate, options.maxPostDate),
          tag: options.tags[random.integer(0, options.tags.length - 1)],
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

