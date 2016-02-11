'use strict';
angular.module('genie.common')
.directive('drawingTools', [function() {

  function link(scope, elem, attrs) {
    scope.scraperCoords = [];
    var shapes = [];

    var stopWatching = scope.$watch('map', function() {
      if (scope.map) {
        drawing.setMap(scope.map);
        // a one-time change
        stopWatching();
      }
    });

    var drawing = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
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

    google.maps.event.addListener(drawing,
      'rectanglecomplete',
      function(rect) {
        clearShapes();
        shapes.push(rect);
        var bounds = rect.getBounds(),
          ne = bounds.getNorthEast(),
          sw = bounds.getSouthWest();
        scope.scraperCoords = [sw.lat(), sw.lng(), ne.lat(), ne.lng()];
        console.info(scope.scraperCoords);
      }
    );

    // remove existing shapes
    function clearShapes() {
      for (var i=0; i<shapes.length; i++) {
        shapes[i].setMap(null);
      }
      shapes = [];
    }
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
