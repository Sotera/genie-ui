'use strict';
//var log = require('debug')('compute_modules:clustered-event-source-helper');
var moment = require('moment');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var async = require('async');
var Random = require('random-js');
var random = new Random(Random.engines.mt19937().autoSeed());
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
var clusteredEventSourceHelper = new LoopbackModelHelper('ClusteredEventSource');

module.exports = class {
  constructor() {
     }

  initialize(cb) {
    clusteredEventSourceHelper.deleteAll(cb);
  }

  randomDate(start, end) {
    return new Date(start.getTime() + random.real(0, 1, false) * (end.getTime() - start.getTime()));
  }

  getEventsForClustererInput(options, cb) {
    var endDate = new Date();//Today
    var intervalDurationMinutes = (24 * 60);
    var intervalsAgo = 1;
    if (arguments.length === 0) {
      throw new Error('Syntax: getEventsForClustererInput([options], callback)');
    }
    else if (arguments.length === 1) {
      if (typeof arguments[0] !== 'function') {
        throw new Error('Syntax: getEventsForClustererInput([options], callback)');
      }
      cb = arguments[0];
    } else if (arguments.length >= 2) {
      if (typeof arguments[1] !== 'function') {
        throw new Error('Syntax: getEventsForClustererInput([options], callback)');
      }
      endDate = options.endDate || endDate;
      intervalDurationMinutes = options.intervalDurationMinutes || intervalDurationMinutes;
      intervalsAgo = options.intervalsAgo || intervalsAgo;
    }

    var minutesAgo = intervalsAgo * intervalDurationMinutes;
    var filterStartDate = moment(endDate);
    filterStartDate.subtract(minutesAgo, 'minutes');
    var filterEndDate = moment(filterStartDate).add(intervalDurationMinutes, 'minutes');

    clusteredEventSourceHelper.find({
      where: {
        post_date: {between: [filterStartDate, filterEndDate]}
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
      cb(err, {minutesAgo, vectorToCluster});
    });
  }

  addClusteredEventSources(options, cb) {
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
    options.maxPostDate = this.convertToDate(options.maxPostDate) || now;
    options.minPostDate = this.convertToDate(options.minPostDate) || sixMonthsAgo;
    options.maxIndexDate = this.convertToDate(options.maxIndexDate) || now;
    options.minIndexDate = this.convertToDate(options.minIndexDate) || sixMonthsAgo;

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
    clusteredEventSourceHelper.createMany(newClusteredEventSources, cb);
  }

  convertToDate(obj) {
    if (obj instanceof Date) {
      return obj;
    }
    try {
      return new Date(obj);
    } catch (err) {
      return null;
    }
  }
}

