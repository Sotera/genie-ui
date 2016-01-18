// def: miscellaneous debug & logging shortcuts
'use strict';

module.exports = {
  // uses specified prefix + current filename to create debug function
  log: prefix => {
    const path = require('path'),
      filename = path.basename(__filename, '.js');

    return require('debug')(prefix + ':' + filename);
  }
};
