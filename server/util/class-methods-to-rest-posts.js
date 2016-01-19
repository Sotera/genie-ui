'use strict';
var log = require('debug')('util:class-methods-to-rest-posts');

module.exports = class {
  constructor(app, _class){
    var self = this;
    self.classInstance = new _class();
    var methods = Object.getOwnPropertyNames(_class.prototype).filter(function(p){
      if(p === 'constructor'){
        return false;
      }
      return typeof self.classInstance[p] === 'function';
    });
    methods.forEach(function(method){
      app.post('/' + method, function (req, res) {
        self.callMethod(req, res, method);
      });
    });
  }

  callMethod(req, res, fnName) {
    var self = this;
    var fn = self.classInstance[fnName];
    fn.bind(self.classInstance)(req.body, function (err, result) {
      restResponse(err, res, result);
    });
  }
}


function restResponse(err, res, result) {
  if (err) {
    res.status(200).end(err.toString());
  } else if (result) {
    var msg = (result instanceof Object) ? JSON.stringify(result) : result.toString();
    res.status(200).end(msg);
  } else {
    res.status(200).end('SUCCESS: ' + (new Date()).toISOString());
  }
}
