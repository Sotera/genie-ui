// def: misc. time-related helpers
'use strict';

module.exports = {
  daysToMinutes: days => {
    return days * 24 * 60;
  },
  minutesToDays: mins => {
    return mins / 24 / 60;
  }
};
