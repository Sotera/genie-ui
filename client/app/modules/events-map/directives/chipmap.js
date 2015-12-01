'use strict';
angular.module('genie.eventsMap')
  .directive('chipmap', ['mapService', function (mapService) {
    function link(scope, elem, attrs) {
      mapService.displayHeatmap({elem: elem[0], zoomLevel: 1})
    }

    return {
      restrict: 'E',
      replace: true,
      link: link,
      template: '<div style="width: 100%; height: 100%;">'
    };
  }]);
