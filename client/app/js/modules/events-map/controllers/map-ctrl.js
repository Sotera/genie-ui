'use strict';
angular.module('genie.eventsMap')
.controller('EventsMapCtrl', ['$scope', 'mapService', 'ZoomLevel',
  'CoreService', '$state',
  function($scope, mapService, ZoomLevel, CoreService, $state) {

  var PERIOD = CoreService.env.period; // days
  var DAY = CoreService.env.day; // mins
  // Set init values
  var zoomLevelObj = new ZoomLevel();
  zoomLevelObj.clusters = [];

  angular.extend($scope, {
    inputs: { zoom_level: null, minutes_ago: DAY * PERIOD },
    map: {},
    timeSeries: {},
    events: [],
    clusters: [],
    selectedCluster: null,
    selectedEvent: null,
    zoomLevelObj: zoomLevelObj,
    features: { heatmap: true, sources: false }
  });

  // Watch user inputs and fetch zoomlevel object
  $scope.$watchCollection('inputs', getZoomLevel);

  function getZoomLevel() {
    mapService.getZoomLevel($scope.inputs)
    .then(updateMap);
  }

  function updateMap(zoomLevelObj) {
    var map = $scope.map;

    if (!zoomLevelObj.clusters.length) {
      CoreService.toastInfo('No Events Found',
        'hint: change the date to search for events');
    }
    $scope.zoomLevelObj = zoomLevelObj;
    $scope.getEventsInBounds();
  }

  $scope.getEventsInBounds = _.debounce(function() {
    var bounds = $scope.map.getBounds();

    console.log(bounds, 'bounds changed');
    if (!bounds) return;

    // update url
    // if ($scope.map.getCenter()) {
    //   $state.go('app.events-map.show',
    //     {center: $scope.map.getCenter().toUrlValue()},
    //     {notify: false});
    // }

    /// TODO: mv to worker and replace bounds.contains()
    var clusters = _.filter($scope.zoomLevelObj.clusters, function(cluster) {
      var latlng = new google.maps.LatLng({
        lat: cluster.location.lat(),
        lng: cluster.location.lng()
      });
      return bounds.contains(latlng);
    });

    // TODO: sorted in mapService. mv to worker?
    $scope.clusters = clusters;

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
