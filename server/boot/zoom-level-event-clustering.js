'use strict';
var log = require('debug')('boot:zoom-level-event-clustering');
var ClassMethodsToRestPosts = require('../util/class-methods-to-rest-posts');
var RestResponseHelper = require('../util/rest-response-helper');
var ZoomLevelEventClusterer = require('../compute_modules/zoom-level-event-clusterer');

const restResponseHelper = new RestResponseHelper();

module.exports = function (app, cb) {
  log('Adding ZoomLevelEventClusterer ReST endpoints.');

  app.get('/generateDevelopmentData', function (req, res) {
    var zoomLevelEventClusterer = new ZoomLevelEventClusterer();
    zoomLevelEventClusterer.generateDevelopmentData({}, function (err, result) {
      res.setHeader('Content-Type', 'application/json');
      restResponseHelper.respond(err, res, result);
    });
  });

  new ClassMethodsToRestPosts(app, ZoomLevelEventClusterer);
  cb();
}

