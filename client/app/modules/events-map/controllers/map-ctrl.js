'use strict';
angular.module('genie.eventsMap')
.controller('EventsMapCtrl', ['$scope', 'mapService', 'ZoomLevel',
  'CoreService',
  function($scope, mapService, ZoomLevel, CoreService) {

  var PERIOD = CoreService.env.period; // days
  var DAY = CoreService.env.day; // mins
  // Set init values
  $scope.inputs = {zoom_level: 18, minutes_ago: DAY * PERIOD};
  $scope.map = {};
  $scope.events = [];
  var zoomLevelObj = new ZoomLevel();
  zoomLevelObj.clusters = [];
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
    .then(function(zoomLevel) {
      updateMap(zoomLevel);
    });
  }

  function updateMap(zoomLevelObj) {
    var map = $scope.map;

    if (!zoomLevelObj.clusters.length) {
      CoreService.toastInfo('No Events Found',
        'hint: change the date to search for events');
    }
    // manual flag: true when no data has been set (init load)
    if (map.empty) {
      if (zoomLevelObj.center_lat) {
        map.setCenter({
          lat: zoomLevelObj.center_lat,
          lng: zoomLevelObj.center_lng
        });
      } else {
        // default to Austin if no events
        map.setCenter({lat: 30.25, lng: -97.75});
      }
      map.empty = false;

      ///////
      // Greenville
      // map.setCenter({lat: 34.84, lng: -82.38});
      // setTimeout(function() {map.setZoom(13);}, 0);
      ///////
    }
    $scope.zoomLevelObj = zoomLevelObj;
  }

}]);
