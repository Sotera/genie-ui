'use strict';

// to enable these logs set `DEBUG=util:findOrCreateObj` or `DEBUG=boot:*`
var log = require('debug')('util:findOrCreateObj');

module.exports = function(model, query, objToCreate, cb) {
  try {
    model.findOrCreate(
      query,
      objToCreate, // create
      function (err, createdObj, created) {
        if (err) {
          log(err);
        }
        cb(err, createdObj);
      });
  } catch (err) {
    log(err);
  }
}
