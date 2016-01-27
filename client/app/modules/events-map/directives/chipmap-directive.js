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

    var zoomLevelObj = new ZoomLevel();
    zoomLevelObj.clusters = [];
    scope.zoomLevelObj = zoomLevelObj;

    mapService
    .getZoomLevel({zoom_level: 18, minutes_ago: 1440})
    .then(function(zoomLevelObj) {
      scope.zoomLevelObj = zoomLevelObj;
      scope.map.setCenter(zoomLevelObj.centerPoint);
    });
  }

  return {
    restrict: 'E',
    replace: true,
    link: link,
    template: '<div style="width: 100%; height: 100%;">'
  };
}]);
