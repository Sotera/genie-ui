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

    scope.$watchCollection(
      function(scope) {
        return scope.zoomLevelObj;
      },
      reheat
    );

    scope.$watch('features.heatmap', reheat);

    function reheat() {
      if (scope.features.heatmap) {
        var clusters = scope.zoomLevelObj.clusters;
        heatmapLayer.setMap(scope.map);
        heatmapLayer.setData(clusters);
        // optionally bypass map markers (default: on)
        if (attrs.markers !== 'off') {
          resetMarkers();
          addMarkers(clusters, scope.map);
        }
      } else {
        heatmapLayer.setMap(null);
        resetMarkers();
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
          opacity: 0 // invisible but clickable
        });
        marker.cluster = cluster; // custom prop

        markers.push(marker);

        marker.addListener('dblclick', function() {
          map.setCenter(cluster.location);
          map.setZoom(_.max([map.getZoom(), 14]));
        })
      });
    }
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
