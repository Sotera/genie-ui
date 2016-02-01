'use strict';
var log = require('debug')('boot:js-class-to-rest-apis');
var extend = require('deep-extend');
var ClassMethodsToRestPosts = require('../util/class-methods-to-rest-posts');
var TwitterHashtagClusterer = require('../compute_modules/twitter-hashtag-clusterer');
var ZoomLevelEventClusterer = require('../compute_modules/zoom-level-event-clusterer');
var baseOptions = {
  postPrefix: 'post_'
  , getPrefix: 'get_'
  , excludePrefix: '_'
};
module.exports = function (app, cb) {
  log('Adding JS Class ReST endpoints.');
  //TwitterHashtagClusterer
  var options = {apiName: 'TwitterHashtagClusterer'};
  extend(options, baseOptions);
  new ClassMethodsToRestPosts(app, TwitterHashtagClusterer, options);
  //ZoomLevelEventClusterer
  options = {apiName: 'ZoomLevelEventClusterer'};
  extend(options, baseOptions);
  new ClassMethodsToRestPosts(app, ZoomLevelEventClusterer, options);
  cb();
}

