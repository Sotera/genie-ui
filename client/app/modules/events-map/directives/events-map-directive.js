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
    map.empty = true; // flag for other directives to know that map is empty
    // map.setCenter({lat: 30.25, lng: -97.75}); // default: Austin
    scope.inputs.zoom_level = mapOptions.zoom;
    scope.map = map;

    map.addListener('zoom_changed', function() {
      var newZoom = map.getZoom();
      console.log(newZoom, 'zoom');
      scope.inputs.zoom_level = newZoom;
      scope.$apply();
      // update url
      $state.go('app.events-map.show', {zoom: newZoom}, {notify: false});
    });

    map.addListener('bounds_changed', scope.getEventsInBounds);
    // scope.boundsChanged();

    resizeMap(map, elem);
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
