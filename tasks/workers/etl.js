'use strict';

module.exports = {
  run: run
};

function run(options) {
  var transform = require('./etl/' + options.transform);
  transform.run();
}
