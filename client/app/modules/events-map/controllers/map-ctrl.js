'use strict';
angular.module('genie.eventsMap')
.controller('MapCtrl', ['$scope', 'mapService', 'ZoomLevel',
  function($scope, mapService, ZoomLevel) {

  // Set init values
  $scope.inputs = {zoomLevel: 18, minutesAgo: 1440};
  $scope.map = {};
  var zoomLevelObj = new ZoomLevel();
  zoomLevelObj.events = [];
  $scope.zoomLevelObj = zoomLevelObj;

  // Watch user inputs and fetch zoomlevel object
  $scope.$watchCollection(
    function(scope) {
      return scope.inputs;
    },
    getZoomLevel
  );

  function getZoomLevel() {
    mapService.getZoomLevel($scope.inputs)
    .then(function(zoomLevelObj) {
      if (!$scope.map.getCenter()) { // center not set
        $scope.map.setCenter(zoomLevelObj.centerPoint);
      }
      $scope.zoomLevelObj = zoomLevelObj;
      //jqcloud tag collection
      // TODO: remove .uniq() once the server has TagCloud api
      $scope.words = _.uniq(_.map(zoomLevelObj.events, function(event) {
        return {text: event.tag, weight: event.weight};
      }), 'text');
    })
  }
}]);
