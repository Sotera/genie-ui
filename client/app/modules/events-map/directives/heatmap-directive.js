'use strict';
angular.module('genie.eventsMap')
.directive('heatMap', ['sourceIconFilter',
  function(sourceIconFilter) {

  function link(scope, elem, attrs, netGraphCtrl) {
    var gmarkers = []; // needed to remove markers on input change
    var heatmapLayer = new google.maps.visualization.HeatmapLayer(
      {
        radius: attrs.radius || 24
      });

    scope.$watchCollection(
      function(scope) {
        return scope.zoomLevelObj;
      },
      reheat
    );

    function reheat() {
      var events = scope.zoomLevelObj.events;
      heatmapLayer.setMap(scope.map);
      heatmapLayer.setData(events);
      // optionally bypass map markers (default: on)
      if (attrs.markers !== 'off') {
        removeMarkers();
        addMarkers(events, scope.map);
      }
    }

    function removeMarkers() {
      for(var i=0; i<gmarkers.length; i++) {
        gmarkers[i].setMap(null);
      }
    }

    function addMarkers(events, map) {
      events.forEach(function addMarker(event) {
        var iconPath = sourceIconFilter(event.eventSource);
        var marker = new google.maps.Marker({
          position: event.location,
          map: map,
          icon: iconPath,
          opacity: 0.3
        });

        gmarkers.push(marker);

        marker.addListener('click', function() {
          var source = event.eventSource;
          if (source === 'sandbox') {
            netGraphCtrl.createNetGraph(event);
          } else if (event.eventSource === 'hashtag') {
            console.info('TODO');
          }
        });
      });
    }
  }

  return {
    restrict: 'AE',
    require: 'networkGraph',
    link: link
  };
}]);
