'use strict';
var log = require('debug')('util:loopback-model-helper');
var async = require('async');

var serverApp = null;
module.exports = class {
  constructor(modelNameOrApp) {
    if (typeof modelNameOrApp === 'function') {
      //Assume Loopback 'app' constructor if 'function'
      serverApp = modelNameOrApp;
    } else if (typeof modelNameOrApp === 'string') {
      this.model = serverApp.models[modelNameOrApp];
    }
  }

  deleteAll(cb) {
    this.model.deleteAll(cb);
  }

  find(query, cb) {
    this.model.find(query, cb);
  }

  findOrCreateMany(queries, objectsToCreate, cb) {
    if (queries.length != objectsToCreate.length) {
      cb(new Error('Queries and ObjectsToCreate lengths differ'));
      return;
    }
    var model = this.model;
    var functionArray = createFunctionArray(objectsToCreate, function (i) {
      return async.apply(findOrCreateObj, model, queries[i], objectsToCreate[i]);
    });
    execFunctionArray(functionArray, cb);
  }

  createMany(objectsToCreate, cb) {
    var model = this.model;
    var functionArray = createFunctionArray(objectsToCreate, function (i) {
      return async.apply(createObj, model, objectsToCreate[i]);
    });
    execFunctionArray(functionArray, cb);
  }

  create(objectToCreate, cb) {
    createObj(this.model, objectToCreate, cb);
  }

  findOrCreate(query, objectToCreate, cb) {
    findOrCreateObj(this.model, query, objectToCreate, cb);
  }

  setApp(app) {
    serverApp = app;
  }
}

function createFunctionArray(objects, getFunctionCb) {
  var functionArray = [];
  for (var i = 0; i < objects.length; ++i) {
    functionArray.push(getFunctionCb(i));
  }
  return functionArray;
}

function execFunctionArray(functionArray, cb) {
  async.parallel(functionArray, function (err, newObjects) {
    if (err) {
      log(err);
      cb(err, null);
      return;
    }
    cb(null, newObjects);
  });
}

function createObj(model, objToCreate, cb) {
  cb = cb || function () {
    };
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

function findOrCreateObj(model, query, objToCreate, cb) {
  cb = cb || function () {
    };
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
    cb(err);
  }
}
