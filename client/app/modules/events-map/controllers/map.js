'use strict';
angular.module('genie.eventsMap')
.controller('MapCtrl', ['$scope', 'mapService', function($scope, mapService) {

  // watch for changed events in map service to update cloud.
  // $scope.$watch(
  //   mapService.getEvents,
  //   function(newEvents) {
  //     $scope.words = _.map(newEvents, function(event) {
  //       return {text: event.tag, weight: event.weight};
  //     });
  //   }
  // );

  $scope.inputs = {zoomLevel: 18, minutesAgo: 1440};
  $scope.map = {};
  $scope.events = [];

  $scope.$watchCollection(
    function(scope) {
      return scope.inputs;
    },
    getEvents
  );

  function getEvents() {
    mapService.getEvents($scope.inputs)
    .then(function(events) {
      $scope.map.setCenter({lat: 41.9, lng: -87.35});
      $scope.events = events;
    })
  }
}]);
