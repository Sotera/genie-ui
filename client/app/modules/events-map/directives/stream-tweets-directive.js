'use strict';
angular.module('genie.eventsMap')

.directive('streamTweets', ['CoreService', 'mapControlService', 'tweetService',
  '$window', function (CoreService, mapControlService, tweetService, $window) {

  function link(scope, elem, attrs) {
    init(scope.map);
    $window.addEventListener('unload', tweetService.stop);
  }

  function createLiveHeatmap(map) {
    var liveTweets = new google.maps.MVCArray();
    var liveHeatmap = new google.maps.visualization.HeatmapLayer({
      data: liveTweets,
      radius: 10
    });
    liveHeatmap.setMap(map);
    return liveTweets;
  }

  function init(map) {
    var liveTweets = createLiveHeatmap(map);
    var startButton = document.createElement('div');
    var stopButton = document.createElement('div');

    mapControlService.createButton(startButton,
      { label: '▶', title: 'Start Twitter stream' });
    mapControlService.createButton(stopButton,
      { label: '■', title: 'Stop Twitter stream' });

    startButton.addEventListener('click', function start() {
      var minZoomForStreaming = 9;
      if (map.getZoom() >= minZoomForStreaming) {
        CoreService.toastSuccess('Start', 'Starting Twitter stream');
        tweetService.init({map: map, tweets: liveTweets});
        tweetService.start({bounds: map.getBounds()});
      } else {
        CoreService.toastInfo('Zoom', 'Please zoom in before streaming');
      }
    });

    stopButton.addEventListener('click', function stop() {
      tweetService.stop();
      CoreService.toastSuccess('Stop', 'Stopping Twitter stream');
    });

    map.controls[google.maps.ControlPosition.TOP_CENTER].push(startButton);
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(stopButton);
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
