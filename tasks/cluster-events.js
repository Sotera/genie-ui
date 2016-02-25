#!/usr/bin/env node

//////////////
//////////////
//////////////
//////////////
// Obsolete - Use node-red flows
//////////////
//////////////
//////////////
//////////////
'use strict';

var app = require('../server/server'),
  Task = app.models.Task,
  log = require('../server/util/debug').log('task'),
  taskName = 'cluster events',
  worker = require('./workers/clusterer');

// HACK
Task.deleteAll();

// TODO: add Task#running, lastError
Task.findOrCreate({
    code: taskName
  },
  {
    code: taskName,
    lastRun: '2015-11-01',
    transform: 'basic'
  },
  runTask);


function runTask(err, task) {
  if (err) {
    log(err);
    return;
  }

  // TODO: update task last run
  worker.run({transform: task.transform});
}
