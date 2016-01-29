// def: a home for long-running processes
importScripts('/bower_components/lodash/lodash.min.js');

var workers = {
  tagCloud: {
    prepare: function(args) {
      // TODO: remove .uniq() once the server has TagCloud api
      var tags = _.uniq(args.tags, 'text');
      postMessage({tags: tags});
    }
  }
  // , anotherworker: {
  //   method: function(args) {}
  // }
};

onmessage = function(e) {
  console.log('message received by worker');
  var args = JSON.parse(e.data.args);
  workers[e.data.worker][e.data.method](args);
}

