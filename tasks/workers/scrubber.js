'use strict';

module.exports = {
  run: run
};

function run(options) {
  var transform = require('./scrubbers/' + options.transform);
  transform.run();
}
