'use strict';

angular.module('com.module.stats')
  .directive('stats-directive', function() {
    return {
      templateUrl: 'modules/stats/views/list',
      restrict: 'E'
    };
  });
