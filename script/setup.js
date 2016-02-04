#!/usr/bin/env node
'use strict';

var async = require('async'),
  request = require('request'),
  app = require('../server/server'),
  LoopbackModelHelper = require('../server/util/loopback-model-helper'),
  SandboxEventsSource = new LoopbackModelHelper('SandboxEventsSource'),
  HashtagEventsSource = new LoopbackModelHelper('HashtagEventsSource'),
  ZoomLevel = new LoopbackModelHelper('ZoomLevel');


function clean(model) {
  return function(done) {
    model.destroyAll({}, err => { done(err); });
  };
}

// delete existing docs, load dev data, build time series
async.parallel([
  clean(ZoomLevel),
  clean(SandboxEventsSource),
  clean(HashtagEventsSource)
  ],
  (err, results) => {
    if (err) throw err;
    request('http://localhost:3000/zoomLevelEventClusterer/generateDevelopmentData',
      (err, res) => {
        if (err) throw err;
        // task is not yet a module
        require('../tasks/build-events-time-series');
      })
  });
