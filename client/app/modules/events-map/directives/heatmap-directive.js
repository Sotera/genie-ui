'use strict';
angular.module('genie.eventsMap')
.directive('heatMap', [function () {

  function link(scope, elem, attrs) {
    var heatmapLayer = new google.maps.visualization.HeatmapLayer();

    scope.$watchCollection(
      function(scope) {
        return scope.zoomLevelObj;
      },
      reheat
    );

    function reheat() {
      heatmapLayer.setMap(scope.map);
      heatmapLayer.setData(scope.zoomLevelObj.events);
    }
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
