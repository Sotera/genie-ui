'use strict';
angular.module('genie.common')
// watch scope variable (like 'events'), and swap class names on change.
// expects watched var to be a string or array.
.directive('dynamicCols', [function() {

  function link(scope, elem, attrs) {
    var before = JSON.parse(attrs.before);
    var after = JSON.parse(attrs.after);

    scope.colClasses = before;

    scope.$watchCollection(attrs.dynamicCols,
      function() {
        if (scope[attrs.dynamicCols].length) {
          scope.colClasses = after;
        } else {
          scope.colClasses = before;
        }
      }
    );
  }

  return {
    link: link
  };
}])
