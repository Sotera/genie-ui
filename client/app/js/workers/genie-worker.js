// def: wrapper around HTML5 web worker to standardize args & err handling
window.Genie = window.Genie || {};
window.Genie.worker = {
  // message arg expects keys: worker, method, args
  run: function(message, callback) {
    'use strict';

    var worker = new Worker('/js/workers/main.js');
    // nested objects should be stringified, it seems
    message.args = JSON.stringify(message.args);

    worker.postMessage(message);

    worker.onmessage = callback;

    worker.onerror = function(e) {
      e.preventDefault();
      console.error(e.message);
    }
  }
};
