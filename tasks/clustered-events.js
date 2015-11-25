var app = require('../server/server'),
  Task = app.models.Task,
  ClusteredEvent = app.models.ClusteredEvent,
  ClusteredEventSource = app.models.ClusteredEventSource,
  log = require('debug')('task:clustered-events'),
  taskName = 'clustered events',
  worker = require('./workers/clusterer');


Task.findOrCreate({
    code: taskName
  },
  {
    code: taskName,
    lastRun: '2015-11-01'
  },
  runTask);

function runTask (err, task) {
  if (err) {
    log(err);
    return;
  }

  //TODO: run for 24, 48 hrs, 1 week ago
  //TODO: add Task#running, lastError
  ClusteredEventSource.find({
    where: {
      indexedDate: {gt: task.lastRun}
    },
    limit: 50
  }, processEventSources)
}

function processEventSources (err, eventSources) {
  if (err) {
    log(err);
    return;
  }

  worker.run({eventSources: eventSources, transform: 'basic'});
  // TODO: update task last run
}
