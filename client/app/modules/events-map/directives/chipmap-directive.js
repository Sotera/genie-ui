'use strict';
angular.module('genie.eventsMap')
.directive('chipmap', ['StylesService', 'mapService', 'ZoomLevel',
  function(StylesService, mapService, ZoomLevel) {

  function link(scope, elem, attrs) {
    var heatmapLayer = new google.maps.visualization.HeatmapLayer({
      radius: attrs.radius || 24
    }),
    mapOptions = {
      zoom: +attrs.zoom || 5,
      styles: StylesService.dark
    };

    angular.extend(scope, {
      chipmap: new google.maps.Map(elem[0], mapOptions)
    });

    heatmapLayer.setMap(scope.chipmap);

    mapService
    .getZoomLevel({zoom_level: 18, minutes_ago: 1440})
    .then(function(zoomLevelObj) {
      if (zoomLevelObj && zoomLevelObj.id) { // found a matching zoomLevelObj
        scope.chipmap.setCenter({lat: zoomLevelObj.center_lat,
          lng: zoomLevelObj.center_lng});
        heatmapLayer.setData(zoomLevelObj.clusters);
      } else {
        scope.chipmap.setCenter({lat: 30.25, lng: -97.75}); // default Austin
      }
    });
  }

  return {
    restrict: 'E',
    replace: true,
    link: link,
    template: '<div style="width: 100%; height: 100%;">'
  };
}]);
