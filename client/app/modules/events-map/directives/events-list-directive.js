'use strict';
angular.module('genie.eventsMap')
.directive('eventsList', ['$timeout', 'sourceIconFilter', '$window',
  function($timeout, sourceIconFilter, $window) {

  function link(scope, elem, attrs, netGraphCtrl) {
    scope.$watchCollection(
      function(scope) {
        return scope.zoomLevelObj;
      },
      getEvents
    );

    resize(elem);

    function getEvents() {
      // collect events from clusters
      var clusters = _.sortBy(scope.zoomLevelObj.clusters, 'weight').reverse();
      var allEvents = clusters.map(function(cluster) {
        return cluster.events;
      });
      scope.events = _.flatten(allEvents);
    }

    scope.showEvent = function(event) {
      var source = event.eventSource;
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
