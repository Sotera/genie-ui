'use strict';
angular.module('genie.eventsMap')
  .directive('chipmap', ['mapService', function (mapService) {
    function link(scope, elem, attrs) {

      var mapOptions = {
        zoom: 1,
        center: {lat: 41.506111, lng: -81.699444},
        styles: mapService.darkStyles
      };
      scope.map = new google.maps.Map(elem[0], mapOptions)
      mapService.applyHeatmap(scope.map)

    }

    return {
      restrict: 'E',
      replace: true,
      link: link,
      template: '<div style="width: 100%; height: 100%;">'
    };
  }]);