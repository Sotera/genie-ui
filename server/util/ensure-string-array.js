'use strict';

// to enable these logs set `DEBUG=util:ensure-string-array` or `DEBUG=boot:*`
var log = require('debug')('util:ensure-string-array');
module.exports = function (sa) {
  var retVal = [];
  try {
    if (sa instanceof Array) {
      sa.forEach(function (s) {
        if (typeof s === 'string') {
          retVal.push(s);
        }
      });
    } else if (typeof sa === 'string') {
      retVal.push(sa);
    }
  } catch (err) {
    log(err);
  }
  return retVal;
}
