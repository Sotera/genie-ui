'use strict';
angular.module('genie.eventsMap')
  .directive('map', ['mapService', 'tweetService', function (mapService, tweetService) {
    function link(scope, elem, attrs) {

      var map = mapService.displayHeatmap({elem: elem[0], zoomLevel: 13});

      //TODO: add event handler to 'realtime' button
      tweetService.start({bounds: map.getBounds()});
    }

    return {
      restrict: 'AE',
      link: link
    };
  }]);
