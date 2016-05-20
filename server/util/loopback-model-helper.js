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
      if (!(this.model = serverApp.models[modelNameOrApp])) {
        return;
      }
      this.findOrCreateQueueQueries = [];
      this.findOrCreateQueueObjectsToCreate = [];
    }
  }

  isValid() {
    return !!this.model;
  }

  getModel() {
    return this.model;
  }

  destroyById(id, cb) {
    this.model.destroyById(id, cb);
  }

  destroyAll(query, cb) {
    this.model.destroyAll(query, cb);
  }

  count(query, options, cb) {
    return this.model.count(query, options, cb);
  }

  findOne(query, options, cb) {
    this.model.findOne(query, options, cb);
  }

  find(query, options, cb) {
    this.model.find(query, options, cb);
  }

  updateAll(query, objectToUpdateWith, cb){
    return this.model.updateAll(query, objectToUpdateWith, cb);
  }

  destroyAll(query, cb){
    this.model.destroyAll(query, cb);
  }

  init(objectToInitWith, cb) {
    var self = this;
    self.find(function (err) {
      if (err) {
        self.create(objectToInitWith, function (err, newObject) {
          if (!err) {
            newObject.destroy(function (err, destroyedObject) {
              cb(err, destroyedObject);
            });
          } else {
            cb(err, newObject);
          }
        });
      } else {
        cb(null, {});
      }
    });
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

  findOrCreateEnqueue(query, objectToCreate) {
    this.findOrCreateQueueQueries.push(query);
    this.findOrCreateQueueObjectsToCreate.push(objectToCreate);
  }

  flushQueues(cb) {
    var queries = this.findOrCreateQueueQueries.splice(0, this.findOrCreateQueueQueries.length);
    var objectsToCreate = this.findOrCreateQueueObjectsToCreate.splice(0, this.findOrCreateQueueObjectsToCreate.length);
    this.findOrCreateMany(queries, objectsToCreate, function(err,results){
      cb(err, results);
    });
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
  const maxSimultaneousParallelOperations = 10;
  var seriesFunctionArray = [];
  while (functionArray.length) {
    var parallelFunctionArray = functionArray.splice(0, maxSimultaneousParallelOperations);
    seriesFunctionArray.push(async.apply(execFunctionArrayInParallel, parallelFunctionArray));
  }
  async.series(seriesFunctionArray, function (err, results) {
    //Since these results will be the results of parallel execution they will really be
    //an array of result arrays. So flatten them.
    var retVal = [].concat.apply([], results);
    cb(err, retVal);
  });
}

function execFunctionArrayInParallel(functionArray, cb) {
  async.parallel(functionArray, function (err, results) {
    if (err) {
      log(err);
      cb(err, null);
      return;
    }
    cb(null, results);
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
    model.findOrCreate(query, objToCreate, cb);
  } catch (err) {
    log(err);
    cb(err);
  }
}
