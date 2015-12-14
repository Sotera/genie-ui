'use strict';

// to enable these logs set `DEBUG=util:updateObj` or `DEBUG=boot:*`
var log = require('debug')('util:updateObj');

module.exports = function(model, query, updateObj, cb) {
  try {
    model.update(
      query,
      updateObj,
      function (err, updatedObj) {
        if (err) {
          log(err);
        }
        cb(err, updatedObj);
      });
  } catch (err) {
    log(err);
    cb(err);
  }
}
