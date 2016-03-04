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
  $scope.features = {heatmap: true, boxes: false};

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
      map.setCenter({lat: 34.84, lng: -82.38});
      setTimeout(function() {map.setZoom(13);}, 0);
      ///////
    }
    $scope.zoomLevelObj = zoomLevelObj;
    $scope.getEventsInBounds();
  }

  $scope.getEventsInBounds = _.debounce(function() {
    var bounds = $scope.map.getBounds();
    if (!bounds) return;
    console.log(bounds, 'bounds changed');
    /// TODO: mv to worker and replace bounds.contains()
    var clusters = _.filter($scope.zoomLevelObj.clusters, function(cluster) {
      var latlng = new google.maps.LatLng({
        lat: cluster.location.lat(),
        lng: cluster.location.lng()
      });
      return bounds.contains(latlng);
    });

    var events = _(clusters).map('events').flatten().value();
    ////
    Genie.worker.run({
      worker: 'eventsList',
      method: 'prepare',
      args: { events: events }
    },
    function(e) {
      $scope.events = e.data.events;
      $scope.$apply();
    });
  }, 333);
}]);
