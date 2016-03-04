'use strict';
angular.module('genie.eventsMap')

.directive('heatmapControls', [function () {

  function link(scope, elem, attrs) {

    var inputs = elem.find('.btn-group');

    scope.$watch('map', function() {
      if (scope.map) {
        var map = scope.map;
        var controls = map.controls[google.maps.ControlPosition.TOP_RIGHT];
        controls.push(inputs[0]);
      }
    });
  }

  return {
    restrict: 'AE',
    link: link,
    templateUrl: 'modules/events-map/views/heatmap-controls'
  };

}]);
