'use strict';
angular.module('genie.eventsMap')
.directive('map', ['mapService', 'tweetService', function (mapService, tweetService) {
  function link(scope, elem, attrs) {

    var map = mapService.displayHeatmap({elem: elem[0], zoomLevel: 13});
    var liveTweets = new google.maps.MVCArray();
    var liveHeatmap = new google.maps.visualization.HeatmapLayer({
      data: liveTweets,
      radius: 25
    });
    liveHeatmap.setMap(map);

    function MapControl(controlDiv, map) {
      // Set CSS for the control border.
      var controlUI = document.createElement('div');
      controlUI.style.backgroundColor = '#fff';
      controlUI.style.border = '2px solid #fff';
      controlUI.style.borderRadius = '3px';
      controlUI.style.cursor = 'pointer';
      controlUI.style.marginBottom = '22px';
      controlUI.style.textAlign = 'center';
      controlUI.title = 'Click to view realtime tweets';
      controlDiv.appendChild(controlUI);

      // Set CSS for the control interior.
      var controlText = document.createElement('div');
      controlText.style.color = 'rgb(25,25,25)';
      controlText.style.fontSize = '16px';
      controlText.style.lineHeight = '38px';
      controlText.style.paddingLeft = '5px';
      controlText.style.paddingRight = '5px';
      controlText.innerHTML = 'Get Tweets';
      controlUI.appendChild(controlText);

      controlUI.addEventListener('click', function() {
        tweetService.init({map: map, liveTweets: liveTweets});
        tweetService.start({bounds: map.getBounds()});
      });

    }

    var controlContainer = document.createElement('div');
    var mapControl = new MapControl(controlContainer, map);

    controlContainer.index = 1;
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlContainer);
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
