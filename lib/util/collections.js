'use strict';

module.exports = {
  // return a range iterator, i.e. for (i of range(1,7,2))
  range: function* range (begin, end, interval) {
    for (let i = begin; i <= end; i += interval) {
      yield i;
    }
  }
};
