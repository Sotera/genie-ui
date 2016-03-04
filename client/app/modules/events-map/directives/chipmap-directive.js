'use strict';
angular.module('genie.eventsMap')
.directive('chipmap', ['StylesService', 'mapService', 'ZoomLevel',
  function(StylesService, mapService, ZoomLevel) {

  function link(scope, elem, attrs) {
    var mapOptions = {
      zoom: +attrs.zoom || 5,
      styles: StylesService.dark
    };

    scope.map = new google.maps.Map(elem[0], mapOptions);
    scope.features = {heatmap: true};

    var zoomLevelObj = new ZoomLevel();
    zoomLevelObj.clusters = [];
    scope.zoomLevelObj = zoomLevelObj;

    mapService
    .getZoomLevel({zoom_level: 18, minutes_ago: 1440})
    .then(function(doc) {
      if (doc && doc.id) { // found a matching doc
        scope.zoomLevelObj = doc;
        scope.map.setCenter({lat: doc.center_lat,
          lng: doc.center_lng});
      } else {
        scope.map.setCenter({lat: 30.25, lng: -97.75}); // default Austin
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
