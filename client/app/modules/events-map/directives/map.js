'use strict';
angular.module('genie.eventsMap')
.directive('map', ['$window', 'mapService', function ($window, mapService) {

  function link(scope, elem, attrs) {
    scope.map = mapService.displayHeatmap({elem: elem[0], zoomLevel: 13});
    resizeMap(scope.map, elem);
  }

  function resizeMap(map, element) {
    var doResize = function doResize () {
      var parent = $("#" + element.parent()[0].id);
      var parentMargins = parent.outerHeight(true) - parent.height();
      var height = $window.innerHeight - element[0].offsetTop - parentMargins ;
      element.css('height', height + 'px');

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
