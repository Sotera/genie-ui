'use strict';

// to enable these logs set `DEBUG=boot:01-load-settings` or `DEBUG=boot:*`
var log = require('debug')('boot:01-load-settings');
var async = require('async');
var findOrCreateObj = require('../util/findOrCreateObj');

module.exports = function (app, cb) {
  var Setting = app.models.Setting;

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
    key: 'nodeRedNodeRoot',
    value: '/api'
  }, {
    type: 'string',
    key: 'nodeRedAdminRoot',
    value: '/red'
  }
  ];

  var functionArray = [];
  newSettings.forEach(function (newSetting) {
    functionArray.push(async.apply(findOrCreateObj,
      Setting,
      {where: {key: newSetting.key}},
      newSetting));
  });
  async.parallel(functionArray, function (err, settings) {
    if (err) {
      log(err);
      cb();
      return;
    }
    cb();
  });
};

