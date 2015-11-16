'use strict';
angular.module('genie.eventsMap')
  .directive('chipmap', ['mapService', function (mapService) {
    function link(scope, element, attrs) {

      var mapOptions = {
        zoom: 1,
        center: {lat: 37.775, lng: -122.434},
        styles: mapService.darkStyles
      };
      scope.map = new google.maps.Map(document.getElementById('chipmap_div'), mapOptions)
      mapService.applyHeatmap(scope.map)

    }

    return {
      restrict: 'E',
      link: link,
      template: '<div id="chipmap_div" style="width: 100%; height: 100%;">'
    };
  }]);