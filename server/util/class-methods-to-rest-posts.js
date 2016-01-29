'use strict';
var log = require('debug')('util:class-methods-to-rest-posts');
var RestResponseHelper = require('../util/rest-response-helper');
const restResponseHelper = new RestResponseHelper();

module.exports = class {
  constructor(app, _class){
    var self = this;
    self.classInstance = new _class(app);
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
      restResponseHelper.respond(err, res, result);
    });
  }
}
