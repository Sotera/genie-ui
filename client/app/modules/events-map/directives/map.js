'use strict';
angular.module('genie.eventsMap')
  .directive('map', ['mapService', function (mapService) {
    function link(scope, element, attrs) {
      var mapOptions = {
        zoom: 13,
        center: {lat: 37.775, lng: -122.434},
        styles: mapService.darkStyles
      };

      scope.map = new google.maps.Map(element[0], mapOptions)

      mapService.applyHeatmap(scope.map)

    }

    return {
      restrict: 'AE',
      link: link
    };
  }]);