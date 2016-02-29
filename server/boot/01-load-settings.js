'use strict';

// to enable these logs set `DEBUG=boot:01-load-settings` or `DEBUG=boot:*`
var log = require('debug')('boot:01-load-settings');
var async = require('async');
var LoopbackModelHelper = require('../util/loopback-model-helper');

module.exports = function (app, cb) {
  log('Checking Settings collection');
  var newSettings = [{
    type: 'string',
    key: 'appName',
    value: 'GENIE UI'
  }, {
    type: 'select',
    key: 'appTheme',
    value: 'skin-midnight',
    options: [
      'skin-blue',
      'skin-black'
    ]
  }, {
    type: 'select',
    key: 'appLayout',
    value: 'fixed',
    options: [
      'fixed',
      'not-fixed'
    ]
  }, {
    type: 'string',
    key: 'formLayout',
    value: 'horizontal'
  }, {
    type: 'int',
    key: 'formLabelSize',
    value: 3
  }, {
    type: 'int',
    key: 'formInputSize',
    value: 9
  }, {
    type: 'boolean',
    key: 'com.module.users.enable_registration',
    value: true
  }, {
    type: 'string',
    key: 'nodeRedFlowsFolder',
    value: './server/node-red'
  }, {
    type: 'string',
    key: 'nodeRedNodesFolder',
    value: './server/node-red/nodes'
  }, {
    type: 'string',
    key: 'nodeRedNodeRoot',
    value: '/api'
  }, {
    type: 'string',
    key: 'nodeRedFlowFile',
    value: 'genie-ui-flows.json'
  }, {
    type: 'string',
    key: 'nodeRedAdminRoot',
    value: '/red'
  }, {
    type: 'string',
    key: 'zoomLevels:startDate',
    value: '2016-01-14'
  }, {
    type: 'string',
    key: 'zoomLevels:endDate',
    value: '2016-01-16'
  }, {
    type: 'int',
    key: 'zoomLevels:intervalMins',
    value: 1440
  }, {
    type: 'int',
    key: 'map:minZoom',
    value: 0
  }, {
    type: 'int',
    key: 'map:maxZoom',
    value: 18
  }, {
    type: 'string',
    key: 'scraper:instagramAccessToken',
    value: ''
  }
  ];

  var settingHelper = new LoopbackModelHelper('Setting');
  var queries = newSettings.map(function (newSetting) {
    return {where: {key: newSetting.key}};
  })
  settingHelper.findOrCreateMany(queries, newSettings, function(err,newSettings){
    cb();
  });
};

