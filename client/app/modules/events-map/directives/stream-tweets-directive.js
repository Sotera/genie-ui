'use strict';
angular.module('genie.eventsMap')

.directive('streamTweets', ['CoreService', 'mapControlService', 'tweetService',
  '$window', function (CoreService, mapControlService, tweetService, $window) {

  function link(scope, elem, attrs) {
    $window.addEventListener('unload', tweetService.stop);

    var map = scope.map;
    var liveHeatmap = new google.maps.visualization.HeatmapLayer({
      radius: 10,
      data: tweetService.tweets,
      map: map
    });

    var startButton = document.createElement('div');
    var stopButton = document.createElement('div');
    var controls = map.controls[google.maps.ControlPosition.TOP_CENTER];

    mapControlService.createButton(startButton,
      { label: '▶', title: 'Start Twitter stream' });
    mapControlService.createButton(stopButton,
      { label: '■', title: 'Stop Twitter stream' });

    startButton.addEventListener('click', function start() {
      var minZoomForStreaming = 9;
      if (map.getZoom() >= minZoomForStreaming) {
        CoreService.toastSuccess('Start', 'Starting Twitter stream');
        tweetService.init({map: map});
        tweetService.start({bounds: map.getBounds()});
      } else {
        CoreService.toastInfo('Zoom', 'Please zoom in before streaming');
      }
    });

    stopButton.addEventListener('click', function stop() {
      tweetService.stop();
      CoreService.toastSuccess('Stop', 'Stopping Twitter stream');
    });

    controls.push(startButton);
    controls.push(stopButton);
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
