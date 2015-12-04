'use strict';
angular.module('genie.eventsMap')
.controller('MapCtrl', ['$scope', 'mapService', function($scope, mapService) {

  // watch for changed events in map service to update cloud.
  $scope.$watch(
    mapService.getEvents,
    function(newEvents) {
      $scope.words = _.map(newEvents, function(event) {
        return {text: event.tag, weight: event.weight};
      });
    }
  );

}]);
