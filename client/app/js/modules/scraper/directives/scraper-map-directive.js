'use strict';
angular.module('genie.scraper')
.directive('scraperMap', ['$window', 'StylesService',
  function ($window, StylesService) {

  function link(scope, elem, attrs) {
    var mapOptions = {
      zoom: +attrs.zoom || 10,
      styles: StylesService.dark,
      streetViewControl: false,
      mapTypeControl: false,
      // scrollwheel: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT
      },
    };

    var map = new google.maps.Map(elem[0], mapOptions);

    //TODO: what to use here?
    var center = {lat: 40.7, lng: -74.0};
    map.setCenter(center);

    map.addListener('zoom_changed', function() {
      // var newZoom = map.getZoom();
      // console.log(newZoom, 'zoom');
      // scope.inputs.zoomLevel = newZoom;
      // scope.$apply();
    });

    resizeMap(map, elem);

    scope.map = map;
  }

  function resizeMap(map, elem) {
    var parent = $('#' + elem.parent()[0].id);
    var doResize = function doResize () {
      var parentMargins = parent.outerHeight(true) - parent.height();
      var bottomHeight = 90;
      var height = $window.innerHeight - elem[0].offsetTop - parentMargins -
        bottomHeight;
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
