'use strict';

const app = require('../server'),
  LoopbackModelHelper = require('../util/loopback-model-helper'),
  GeoTweet = new LoopbackModelHelper('GeoTweet'),
  GeoTweetHashtagIndex = new LoopbackModelHelper('GeoTweetHashtagIndex'),
  HashtagEventsSource = new LoopbackModelHelper('HashtagEventsSource'),
  ZoomLevel = new LoopbackModelHelper('ZoomLevel'),
  Setting = new LoopbackModelHelper('Setting'),
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

  // easily update a setting: api/settings requires id in filter so this is easier.
  // expects options: filter, updates
  post_updateSetting(options, cb) {
    Setting.updateAll(options.filter, options.updates)
    .then(res => cb(null, res))
    .catch(cb);
  }
};
