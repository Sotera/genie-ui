'use strict';
angular.module('genie.common')
.directive('drawingTools', [function () {

  function link(scope, elem, attrs) {
    scope.scraperCoords = [];

    var drawing = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.RECTANGLE
        ]
      },
      rectangleOptions: {
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#FF0000',
        fillOpacity: 0.15,
        clickable: true,
        editable: true
      }
    });
    drawing.setMap(scope.map);

    google.maps.event.addListener(drawing,
      'rectanglecomplete',
      function(rect) {
        var bounds = rect.getBounds(),
          ne = bounds.getNorthEast(),
          sw = bounds.getSouthWest();
        scope.scraperCoords = [sw.lat(), sw.lng(), ne.lat(), ne.lng()];
      }
    );
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
