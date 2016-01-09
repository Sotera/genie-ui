'use strict';

module.exports = {
  run: run
};

function run(options) {
  var transform = require('./transforms/' + options.transform);
  transform.run();
}
