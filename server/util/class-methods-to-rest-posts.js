'use strict';
var log = require('debug')('util:class-methods-to-rest-posts');
var RestResponseHelper = require('../util/rest-response-helper');
const restResponseHelper = new RestResponseHelper();

module.exports = class {
  constructor(app, _class, options) {
    options = options || {};
    //apiName allows crude namespacing of exported ReST API
    // e.g. - (apiName == 'MyAPI') ==> '(POST|GET) http://<host>/MyAPI/<method>'
    var apiName = options.apiName || '';
    var postPrefix = options.postPrefix || '';
    var getPrefix = options.getPrefix || '';
    var excludePrefix = options.excludePrefix || '';
    //RULES:
    //1) If postPrefix & getPrefix are empty then all methods are exported as POSTs
    //2) If postPrefix is not empty then any method name starting with the postPrefix
    //   is exported as a POST minus the postPrefix
    //3) If getPrefix is not empty then any method name starting with the getPrefix
    //   is exported as a GET minus the getPrefix
    //4) If excludePrefix is not empty then any method name starting with the exclude
    //   prefix will not be exported
    //5) Rule precedence: exclude, get, post
    //6) Method parameters are passed as content-type='application/json' in the post
    //   buffer for POSTs and as query strings for GETs
    var self = this;
    self.classInstance = new _class(app);
    var methods = Object.getOwnPropertyNames(_class.prototype).filter(function (p) {
      if ((p === 'constructor') || (typeof self.classInstance[p] !== 'function')) {
        return false;
      }
      if (excludePrefix.length && p.startsWith(excludePrefix)) {
        return false;
      }
      return true;
    });
    var apiRoute = '/';
    if (apiName && (typeof apiName === 'string')) {
      apiRoute += apiName + '/';
    }
    methods.forEach(function (methodName) {
      var action = 'post';
      var restMethodName = methodName;
      if (getPrefix.length && methodName.startsWith(getPrefix)) {
        action = 'get';
        restMethodName = methodName.slice(getPrefix.length);
      } else if (postPrefix.length) {
        if (methodName.startsWith(postPrefix)) {
          restMethodName = methodName.slice(postPrefix.length);
        } else {
          return;
        }
      }
      app[action](apiRoute + restMethodName, function (req, res) {
        self.callMethod(req, res, action, methodName);
      });
    });
  }

  callMethod(req, res, action, methodName) {
    var self = this;
    var fn = self.classInstance[methodName];
    try {
      var options = (action === 'post')
        ? req.body
        : (action === 'get')
        ? req.query
        : {}
      fn.bind(self.classInstance)(options, function (err, result) {
        res.setHeader('Content-Type', 'application/json');
        restResponseHelper.respond(err, res, result);
      });
    } catch (err) {
      restResponseHelper.respond(err, res);
    }
  }
}
