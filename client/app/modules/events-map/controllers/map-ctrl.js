'use strict';
angular.module('genie.eventsMap')
.controller('EventsMapCtrl', ['$scope', 'mapService', 'ZoomLevel',
  'tweetService', 'CoreService',
  function($scope, mapService, ZoomLevel, tweetService, CoreService) {

  var PERIOD = CoreService.env.period; // days
  var DAY = CoreService.env.day; // mins
  // Set init values
  $scope.inputs = {zoom_level: 18, minutes_ago: DAY * PERIOD};
  $scope.map = {};
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

  // Watch live hashtags
  // $scope.liveTags = tweetService.getHashtags();

  function getZoomLevel() {
    mapService.getZoomLevel($scope.inputs)
    .then(function(zoomLevel) {
      updateMap(zoomLevel);
    });
  }

  function updateMap(zoomLevelObj) {
    if (!zoomLevelObj.clusters.length) {
      CoreService.toastInfo('No Events Found',
        'hint: change the date to search for events');
    }
    // manual flag: true when no data has been set (init load)
    if ($scope.map.empty) {
      // default to Austin, if no events
      var center = zoomLevelObj.centerPoint || {lat: 30.25, lng: -97.75};
      $scope.map.setCenter(center);
      $scope.map.empty = false;
    }
    $scope.zoomLevelObj = zoomLevelObj;
  }

}]);
