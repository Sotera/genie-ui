'use strict';
var log = require('debug')('boot:js-class-to-rest-apis');
var extend = require('deep-extend');
var ClassMethodsToRestPosts = require('../util/class-methods-to-rest-posts');
var TwitterHashtagClusterer = require('../compute_modules/twitter-hashtag-clusterer');
var ZoomLevelEventClusterer = require('../compute_modules/zoom-level-event-clusterer');
var ETL = require('../compute_modules/etl');
var SourceDataAccess = require('../compute_modules/source-data-access');
var Dev = require('../compute_modules/dev');
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
  //ETL
  options = {apiName: 'ETL'};
  extend(options, baseOptions);
  new ClassMethodsToRestPosts(app, ETL, options);
  //source data access
  options = {apiName: 'SourceDataAccess'};
  extend(options, baseOptions);
  new ClassMethodsToRestPosts(app, SourceDataAccess, options);
  //dev
  options = {apiName: 'Dev'};
  extend(options, baseOptions);
  new ClassMethodsToRestPosts(app, Dev, options);

  cb();
};

