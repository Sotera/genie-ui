'use strict';

module.exports = {
  // return a range iterator, ex: for (i of range(1,10,2))
  // counts up or down. interval defaults to 1
  range: function* range (begin, end, interval) {
    let i = begin;
    interval = interval || 1;
    if (begin <= end) { // increasing range
      for (; i <= end; i += interval) {
        yield i;
      }
    } else { // decreasing range
      for (; i >= end; i -= interval) {
        yield i;
      }
    }
  }
};
