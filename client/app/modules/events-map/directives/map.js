'use strict';
angular.module('genie.eventsMap')
  .directive('map', ['mapService', function (mapService) {
    function link(scope, elem, attrs) {

      mapService.displayHeatmap({elem: elem[0], zoomLevel: 13})

    }

    return {
      restrict: 'AE',
      link: link
    };
  }]);