'use strict';
angular.module('genie.eventsMap')
.directive('heatMap', ['sourceIconFilter', 'ImageManagerService',
  function(sourceIconFilter, ImageManagerService) {

  function link(scope, elem, attrs) {
    var markers = []; // needed to remove markers on input change
    var heatmapLayer = new google.maps.visualization.HeatmapLayer(
      {
        radius: attrs.radius || 24
      });
    var defaultIcon = '//www.googlemapsmarkers.com/v1/ccc/';
    var clickedIcon = '//www.googlemapsmarkers.com/v1/00ff00/';

    scope.$watchCollection(
      function(scope) {
        return scope.zoomLevelObj;
      },
      reheat
    );

    function reheat() {
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

    function resetIcons() {
      for(var i=0; i<markers.length; i++) {
        markers[i].setIcon(defaultIcon);
      }
    }

    function addMarkers(clusters, map) {
      clusters.forEach(function addMarker(cluster) {
        var marker = new google.maps.Marker({
          position: cluster.location,
          icon: defaultIcon,
          map: map,
          opacity: 0.7
        });

        markers.push(marker);

        marker.addListener('click', function() {
          ImageManagerService.clear();
          resetIcons();
          marker.setIcon(clickedIcon);
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
