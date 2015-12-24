'use strict';
angular.module('genie.eventsMap')

.directive('twitterStream', ['tweetService', '$window',
  function (tweetService, $window) {

  function link(scope, elem, attrs) {
    $window.addEventListener('unload', tweetService.stop);

    var map = scope.map;
    var liveHeatmap = new google.maps.visualization.HeatmapLayer({
      radius: 10,
      data: tweetService.tweets,
      map: map
    });
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
