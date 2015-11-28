'use strict';
angular.module('genie.eventsMap')
.directive('map', ['mapService', 'tweetService', 'mapControlService', '$window',
  function (mapService, tweetService, mapControlService, $window) {

  function main(scope, elem, attrs) {
    var map = mapService.displayHeatmap({elem: elem[0], zoomLevel: 13});
    createMapControls(map);
    resizeMap(map, elem);

  }

  function resizeMap(map, element) {
    var doResize = function () {
      var parent = $("#" + element.parent()[0].id);
      var parentMargins = parent.outerHeight(true) - parent.height();
      var height = $window.innerHeight - element[0].offsetTop - parentMargins ;
      element.css('height', height + 'px');

      google.maps.event.trigger(map, "resize");
    };

    angular.element($window).bind('resize', _.throttle(function () {
      doResize();
    },33.33));

    $(document).ready(doResize);
  }

  function creatLiveHeatmap(map) {
    var liveTweets = new google.maps.MVCArray();
    var liveHeatmap = new google.maps.visualization.HeatmapLayer({
      data: liveTweets,
      radius: 10
    });
    liveHeatmap.setMap(map);
    return liveTweets;
  }

  function createMapControls(map, liveTweets) {
    var startButton = document.createElement('div');
    var stopButton = document.createElement('div');
    mapControlService.createButton(startButton,
      { label: '▶', title: 'Start Twitter stream' });
    mapControlService.createButton(stopButton,
      { label: '■', title: 'Stop Twitter stream' });

    startButton.addEventListener('click', function start() {
      var liveTweets = creatLiveHeatmap(map);
      tweetService.init({map: map, liveTweets: liveTweets});
      tweetService.start({bounds: map.getBounds()});
    });

    stopButton.addEventListener('click', function stop() {
      tweetService.stop();
    });

    map.controls[google.maps.ControlPosition.TOP_CENTER].push(startButton);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(stopButton);
  }

  return {
    restrict: 'AE',
    link: main
  };
}]);
