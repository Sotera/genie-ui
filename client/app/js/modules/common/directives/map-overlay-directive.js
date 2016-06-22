'use strict';
angular.module('genie.common')
.directive('mapOverlay', [
  function() {

  function link(scope, elem, attrs) {
    scope.shrunk = false;

    elem.dblclick(function() {
      var action = scope.overlayAction;
      if (action === 'hide') {
        $(this).addClass(action);
      } else if (action === 'shrink') {
        var height = elem.height();
        if (scope.shrunk) {
          elem.height( height * 5 );
        } else {
          elem.height( height / 5 );
        }
        scope.shrunk = !scope.shrunk;
      }
      if (scope.afterAction) scope.afterAction();
    });
  }

  return {
    scope: {
      overlayAction: '@',
      afterAction: '&'
    },
    link: link
  };
}]);
