'use strict';
angular.module('genie.eventsMap')

.directive('streamControls', ['CoreService', 'tweetService',
  function (CoreService, tweetService) {

  function link(scope, elem, attrs) {
    var map = scope.map;
    var startButton = document.createElement('div');
    var stopButton = document.createElement('div');
    var controls = map.controls[google.maps.ControlPosition.TOP_CENTER];

    createButton(startButton, { label: '▶', title: 'Start Twitter stream' });
    createButton(stopButton, { label: '■', title: 'Stop Twitter stream' });

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

  function createButton(container, options) {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.marginRight = '8px';
    controlUI.style.textAlign = 'center';
    controlUI.title = options.title;
    container.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = options.label;
    controlUI.appendChild(controlText);
  }

  return {
    link: link
  };
}]);
