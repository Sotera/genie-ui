'use strict';
angular.module('genie.eventsMap')
.directive('heatMap', ['sourceIconFilter',
  function(sourceIconFilter) {

  function link(scope, elem, attrs) {
    var markers = []; // needed to remove markers on input change
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
      markers = [];
      var clusters = scope.zoomLevelObj.clusters;
      heatmapLayer.setMap(scope.map);
      heatmapLayer.setData(clusters);
      // optionally bypass map markers (default: on)
      if (attrs.markers !== 'off') {
        resetMarkers();
        addMarkers(clusters, scope.map);
      }
    }

    function resetMarkers() {
      for(var i=0; i<markers.length; i++) {
        markers[i].setMap(null);
        markers[i] = null;
      }
      markers = [];
    }

    function addMarkers(clusters, map) {
      clusters.forEach(function addMarker(cluster) {
        var marker = new google.maps.Marker({
          position: cluster.location,
          map: map,
          opacity: 0.3
        });

        markers.push(marker);

        marker.addListener('click', function() {
          Genie.worker.run({
            worker: 'eventsList',
            method: 'prepare',
            args: { events: cluster.events }
          },
          function(e) {
            scope.events = e.data.events;
            scope.$apply();
          });
        });
      });
    }
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
