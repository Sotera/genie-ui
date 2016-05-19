'use strict';

const app = require('../server'),
  LoopbackModelHelper = require('../util/loopback-model-helper'),
  GeoTweet = new LoopbackModelHelper('GeoTweet'),
  GeoTweetHashtagIndex = new LoopbackModelHelper('GeoTweetHashtagIndex'),
  HashtagEventsSource = new LoopbackModelHelper('HashtagEventsSource'),
  ZoomLevel = new LoopbackModelHelper('ZoomLevel'),
  _ = require('lodash')
  ;

module.exports = class {

  post_prepHashtagCluster(options, cb) {
    const helpers = [GeoTweet, GeoTweetHashtagIndex,
      HashtagEventsSource, ZoomLevel];
    Promise.all(_.invoke(helpers, 'destroyAll'))
    .then(() => cb())
    .catch(cb);
  }

};
