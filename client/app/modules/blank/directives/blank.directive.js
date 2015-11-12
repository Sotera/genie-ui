'use strict';

angular.module('com.module.blank')
  .directive('blank-directive', function() {
    return {
      templateUrl: 'modules/blank/views/list',
      restrict: 'E'
    };
  });
