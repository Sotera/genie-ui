'use strict';
angular.module('genie.eventsMap')
.filter('sourceIcon', [function() {
  return function(source) {
    var iconPath = source ?
      'images/' + source + '.gif' :
      null; // null = default marker icon

    return iconPath;
  };
}]);
