'use strict';
var log = require('debug')('util:rest-response-helper');
var stringify = require('json-stable-stringify');

module.exports = class {
  constructor() {
  }

  respond(err, res, result, status) {
    if (err) {
      err = this.toString(err);
      log(err);
      res.status(500).end(err);
    } else if (result) {
      res.status(status || 200).end(this.toString(result));
    } else {
      res
      .status(status || 200)
      .end(stringify({success: (new Date()).toISOString()}), {space: 3});
    }
  }

  toString(o) {
    return (o instanceof Error)
      ? stringify({error: o.message}, {space: 3})
      : (o instanceof Object)
      ? stringify(o, {space: 3})
      : o.toString();
  }
}



