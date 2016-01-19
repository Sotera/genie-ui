'use strict';
var log = require('debug')('boot:zoom-level-event-clustering');
var ClassMethodsToRestPosts = require('../util/class-methods-to-rest-posts');
var ZoomLevelEventClusterer = require('../compute_modules/zoom-level-event-clusterer');
module.exports = function (app, cb) {
  log('Adding ZoomLevelEventClusterer ReST endpoints.');
  new ClassMethodsToRestPosts(app, ZoomLevelEventClusterer);
  cb();
}

