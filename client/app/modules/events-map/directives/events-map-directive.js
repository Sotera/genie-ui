'use strict';
angular.module('genie.eventsMap')
.directive('eventsMap', ['$window', 'StylesService',
  function ($window, StylesService) {

  function link(scope, elem, attrs) {
    var mapOptions = {
      zoom: +attrs.zoom || 10,
      styles: StylesService.dark,
      streetViewControl: false,
      mapTypeControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT
      },
    };

    var map = new google.maps.Map(elem[0], mapOptions);

    map.addListener('zoom_changed', function() {
      var newZoom = map.getZoom();
      console.log(newZoom, 'zoom');
      scope.inputs.zoomLevel = newZoom;
      scope.$apply();
    });

    resizeMap(map, elem);

    scope.map = map;
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
