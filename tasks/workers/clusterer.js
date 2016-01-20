'use strict';

module.exports = {
  run: run
};

function run(options) {
  var transform = require('./clusterizers/' + options.transform);
  transform.run();
}
