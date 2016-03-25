'use strict';

const entityExtractTask = require('../../tasks/workers/etl/entity-extract/etl');

module.exports = class {

  post_entityExtract(options, cb) {
    // fire and forget!
    cb();
    // invoke the worker process once
    entityExtractTask.run();
  }

};
