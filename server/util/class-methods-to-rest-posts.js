'use strict';
var log = require('debug')('util:class-methods-to-rest-posts');
var RestResponseHelper = require('../util/rest-response-helper');
const restResponseHelper = new RestResponseHelper();

module.exports = class {
  constructor(app, _class, options) {
    options = options || {};
    var self = this;
    self.classInstance = new _class(app);
    var methods = Object.getOwnPropertyNames(_class.prototype).filter(function (p) {
      if (p === 'constructor') {
        return false;
      }
      return typeof self.classInstance[p] === 'function';
    });
    var methodPrefix = '/';
    if(options.className && (typeof options.className === 'string')){
      methodPrefix += options.className + '/';
    }
    methods.forEach(function (method) {
      if(options.hideUnderscoreMethods && method.startsWith('_')){
        return;
      }
      app.post(methodPrefix + method, function (req, res) {
        self.callMethod(req, res, method);
      });
    });
  }

  callMethod(req, res, fnName) {
    var self = this;
    var fn = self.classInstance[fnName];
    try{
      fn.bind(self.classInstance)(req.body, function (err, result) {
        restResponseHelper.respond(err, res, result);
      });
    }catch(err){
      restResponseHelper.respond(err, res);
    }
  }
}
