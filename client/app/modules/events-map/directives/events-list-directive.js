'use strict';
angular.module('genie.eventsMap')
.directive('eventsList', ['$timeout', 'sourceIconFilter', '$window',
  function($timeout, sourceIconFilter, $window) {

  function link(scope, elem, attrs, netGraphCtrl) {
    resize(elem);

    scope.showEvent = function(event) {
      var source = event.event_source;
      if (source === 'sandbox') {
        netGraphCtrl.createNetGraph(event);
      } else if (event.eventSource === 'hashtag') {
        console.info('TODO');
      }
      animateMarker(event);
    }

    function animateMarker(event) {
      var iconPath = sourceIconFilter(event.event_source);
      var marker = new google.maps.Marker({
        map: scope.map,
        icon: iconPath,
        animation: google.maps.Animation.DROP,
        position: {lat: event.lat, lng: event.lng}
      });

      $timeout(function() {
        marker.setMap(null);
        marker = null;
      }, 1000);
    }

    function resize(elem) {
      var $win = $($window);
      var $list = $(elem.children()[0]);
      var doResize = function() {
        var winHeight = $win.height();
        $list.height(winHeight * 0.7);
      };

      $win.bind('resize', _.throttle(doResize, 33.33)).resize();
    }
  }

  return {
    restrict: 'E',
    require: 'networkGraph',
    link: link,
    templateUrl: '/modules/events-map/views/events-list'
  };
}]);
