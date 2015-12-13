'use strict';
angular.module('genie.eventsMap')
.directive('map', ['$window', 'stylesService',
  function ($window, stylesService) {

  function link(scope, elem, attrs) {
    var mapOptions = {
      zoom: +attrs.zoom || 10,
      styles: stylesService.dark,
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
      // changeFocus({zoomLevel: map.getZoom(), map: map});
      // tweetService.stop();
    });

    resizeMap(map, elem);

    scope.map = map;

    // createControls(map);
    // notCentered on initial view
    // changeFocus({zoomLevel: options.zoomLevel, map: map, notCentered: true});
  }

  // function changeFocus(options) {
  //   var zoomLevel = options.zoomLevel || options.map.getZoom();
  //   minutesAgo = +options.minutesAgo || minutesAgo;

  //   mapService.findZoomLevel(zoomLevel, minutesAgo)
  //   .then(
  //     regenerateHeatmap({map: options.map, notCentered: options.notCentered})
  //   );
  // }

  function resizeMap(map, elem) {
    var parent = $('#' + elem.parent()[0].id);
    var doResize = function doResize () {
      var parentMargins = parent.outerHeight(true) - parent.height();
      var height = $window.innerHeight - elem[0].offsetTop - parentMargins ;
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
