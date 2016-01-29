'use strict';
var log = require('debug')('boot:twitter-hashtag-clustering');
var ClassMethodsToRestPosts = require('../util/class-methods-to-rest-posts');
var TwitterHashtagClusterer = require('../compute_modules/twitter-hashtag-clusterer');

module.exports = function (app, cb) {
  log('Adding TwitterHashtagClustering ReST endpoints.');
  new ClassMethodsToRestPosts(app, TwitterHashtagClusterer, {
    className: 'TwitterHashtagClusterer',
    hideUnderscoreMethods: true
  });
  cb();
}

