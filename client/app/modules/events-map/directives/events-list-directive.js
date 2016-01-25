'use strict';
angular.module('genie.eventsMap')
.directive('eventsList', ['ImageManagerService', 'SandboxEventsSource',
  '$timeout', 'sourceIconFilter',
  function (ImageManagerService, SandboxEventsSource, $timeout,
    sourceIconFilter) {

  function link(scope, elem, attrs, netGraphCtrl) {
    scope.$watchCollection(
      function(scope) {
        return scope.zoomLevelObj;
      },
      getEvents
    );

    function getEvents() {
      scope.events = _.sortBy(scope.zoomLevelObj.events, 'weight').reverse();
    }

    scope.showEvent = function(event) {
      var source = event.eventSource;
      if (source === 'sandbox') {
        netGraphCtrl.createNetGraph(event);
      } else if (event.eventSource === 'hashtag') {
        console.info('TODO');
      }
      animateMarker(event);
    }

    function animateMarker(event) {
      var iconPath = sourceIconFilter(event.eventSource);
      var marker = new google.maps.Marker({
        map: scope.map,
        icon: iconPath,
        animation: google.maps.Animation.DROP,
        position: {lat: event.location.lat(), lng: event.location.lng()}
      });

      $timeout(function() {
        marker.setMap(null);
        marker = null;
      }, 1000);
    }
  }

  return {
    restrict: 'E',
    require: 'networkGraph',
    link: link,
    templateUrl: '/modules/events-map/views/events-list'
  };
}]);
