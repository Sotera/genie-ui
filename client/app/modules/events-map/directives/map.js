'use strict';
angular.module('genie.eventsMap')
.directive('map', ['mapService', 'tweetService', 'mapControlService',
  function (mapService, tweetService, mapControlService) {

  function main(scope, elem, attrs) {
    var map = mapService.displayHeatmap({elem: elem[0], zoomLevel: 13});
    createMapControls(map);
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
    mapControlService.createButton(startButton, { label: 'Start' });
    mapControlService.createButton(stopButton, { label: 'Stop' });

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
