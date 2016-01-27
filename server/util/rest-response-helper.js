'use strict';
var log = require('debug')('util:rest-response-helper');
var stringify = require('json-stable-stringify');

module.exports = class {
  constructor(){
  }

  respond(err, res, result, status) {
    status = status || 200;
    if (err) {
      err = this.toString(err);
      log(err);
      res.status(status).end(err);
    } else if (result) {
      res.status(status).end(this.toString(result));
    } else {
      res.status(status).end('SUCCESS: ' + (new Date()).toISOString());
    }
  }

  toString(o){
    return (o instanceof Object) ? stringify(o, {space: 3}) : o.toString();
  }
}



