'use strict';
angular.module('genie.common')
.directive('mapOverlay', [
  function() {

  function link(scope, elem, attrs) {
    scope.shrunk = false;

    elem.dblclick(function() {
      if (scope.action === 'hide') {
        $(this).addClass(scope.action);
      } else if (scope.action === 'shrink') {
        var height = elem.height();
        if (scope.shrunk) {
          elem.height( height * 4 );
        } else {
          elem.height( height / 4 );
        }
        scope.shrunk = !scope.shrunk;
      }
    });
  }

  return {
    scope: {
      action: '@'
    },
    link: link
  };
}]);
