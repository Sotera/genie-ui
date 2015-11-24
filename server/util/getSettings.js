'use strict';

// to enable these logs set `DEBUG=util:getSettings` or `DEBUG=boot:*`
var log = require('debug')('util:getSettings');
var app = require('../../server/server');
module.exports = function (settingKeys, cb) {
  try {
    var settingKeyQueryArray = settingKeys.map(function (settingKey) {
      return {key: settingKey};
    });
    var query = {where: {or: settingKeyQueryArray}};
    app.models.Setting.find(query, function (err, settings) {
      var retVal = {};
      settingKeys.forEach(function(settingKey){
        settings.forEach(function(setting){
          if(setting.key === settingKey){
            retVal[settingKey] = setting.value;
          }
        });
      });
      cb(retVal);
    });
  } catch (err) {
    log(err);
    cb(null);
  }
}
