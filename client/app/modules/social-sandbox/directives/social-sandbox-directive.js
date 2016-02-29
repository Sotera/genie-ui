'use strict';
angular.module('genie.socialSandbox')
.directive('socialSandbox', ['$window',
  function($window) {

  function link(scope, elem, attrs) {
    resize(elem);
  }

  function resize(elem) {
    var $win = $($window);
    var $iframe = $(elem.children()[0]);
    var doResize = function() {
      var winHeight = $win.height();
      $iframe.height(winHeight * 0.8);
    };

    $win.bind('resize', _.throttle(doResize, 33.33)).resize();
  }
  return {
    restrict: 'E',
    link: link,
    templateUrl: 'modules/social-sandbox/views/social-sandbox'
  };
}]);
