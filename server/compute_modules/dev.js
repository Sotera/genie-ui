'use strict';

const app = require('../server'),
  LoopbackModelHelper = require('../util/loopback-model-helper'),
  GeoTweet = new LoopbackModelHelper('GeoTweet'),
  GeoTweetHashtagIndex = new LoopbackModelHelper('GeoTweetHashtagIndex'),
  HashtagEventsSource = new LoopbackModelHelper('HashtagEventsSource'),
  ZoomLevel = new LoopbackModelHelper('ZoomLevel')
  ;

module.exports = class {

  post_prepHashtagCluster(options, cb) {
    Promise.all([
      GeoTweet.destroyAll(),
      GeoTweetHashtagIndex.destroyAll(),
      HashtagEventsSource.destroyAll(),
      ZoomLevel.destroyAll()
    ])
    .then(() => cb())
    .catch(cb);
  }

};
