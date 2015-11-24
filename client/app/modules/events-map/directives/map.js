'use strict';
angular.module('genie.eventsMap')
  .directive('map', ['$window','mapService', function ($window,mapService) {
    function link(scope, element, attrs) {
      mapService.displayHeatmap({elem: element[0], zoomLevel: 13});

      var doResize = function () {
        var parent = $("#" + element.parent()[0].id);
        var parentMargins = parent.outerHeight(true) - parent.height();
        var height = $window.innerHeight - element[0].offsetTop - parentMargins ;
        element.css('height', height + 'px');

        google.maps.event.trigger(map, "resize");
      };

      angular.element($window).bind('resize', _.throttle(function () {
        doResize();
        scope.$apply();
      },33.33));

      $(document).ready(doResize);


    }

    return {
      restrict: 'AE',
      link: link
    };
  }]);
