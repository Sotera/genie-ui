'use strict';
angular.module('genie.eventsMap')
.directive('eventsMap', ['$window', 'StylesService', '$state', '$stateParams',
  function($window, StylesService, $state, $stateParams) {

  function link(scope, elem, attrs) {
    var mapOptions = {
      zoom: +$stateParams.zoom || +attrs.zoom || 10,
      styles: StylesService.dark,
      streetViewControl: false,
      mapTypeControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT
      },
    };

    var map = new google.maps.Map(elem[0], mapOptions);

    // resize before setCenter()
    resizeMap(map, elem);

    if ($stateParams.center && $stateParams.center.length) {
      var center = $stateParams.center.split(',');
      map.setCenter({lat: +center[0], lng: +center[1]}); // from url
    } else {
      map.setCenter({lat: 7.9, lng: 1.0}); // Ghana, just because
    }
    scope.inputs.zoom_level = mapOptions.zoom;
    scope.map = map;

    map.addListener('zoom_changed', function() {
      var newZoom = map.getZoom();
      var TRIGGER = 11;
      console.log(newZoom, 'zoom');
      scope.inputs.zoom_level = newZoom;
      // when zoomed in, auto-hide heatmap & show sources
      if (newZoom >= TRIGGER) {
        scope.features.heatmap = false;
        scope.features.sources = true;
      } else if (newZoom < TRIGGER) {
        scope.features.heatmap = true;
      }
      scope.$apply();
      // update url
      $state.go('app.events-map.show',
        { zoom: newZoom, center: scope.map.getCenter().toUrlValue() },
        { notify: false }
      );
    });

    map.addListener('bounds_changed', scope.getEventsInBounds);
  }

  function resizeMap(map, elem) {
    var parent = $('#' + elem.parent()[0].id);
    var doResize = function doResize () {
      var parentMargins = parent.outerHeight(true) - parent.height();
      var height = $window.innerHeight - elem[0].offsetTop - parentMargins;
      elem.css('height', height + 'px');

      google.maps.event.trigger(map, 'resize');
    };

    angular.element($window).bind('resize', _.throttle(doResize, 33.33));

    $(document).ready(doResize);
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
