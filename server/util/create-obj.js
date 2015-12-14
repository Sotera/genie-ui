'use strict';

// to enable these logs set `DEBUG=util:createObj` or `DEBUG=boot:*`
var log = require('debug')('util:createObj');

module.exports = function(model, objToCreate, cb) {
  try {
    model.create(
      objToCreate, // create
      function (err, createdObj) {
        if (err) {
          log(err);
        }
        cb(err, createdObj);
      });
  } catch (err) {
    log(err);
    cb(err);
  }
}
