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
      var clusters = scope.zoomLevelObj.clusters;
      heatmapLayer.setMap(scope.map);
      heatmapLayer.setData(clusters);
      // optionally bypass map markers (default: on)
      if (attrs.markers !== 'off') {
        removeMarkers();
        addMarkers(clusters, scope.map);
      }
    }

    function removeMarkers() {
      for(var i=0; i<gmarkers.length; i++) {
        gmarkers[i].setMap(null);
      }
    }

    function addMarkers(clusters, map) {
      clusters.forEach(function addMarker(cluster) {
        var iconPath = sourceIconFilter(cluster.event_source);
        var marker = new google.maps.Marker({
          position: cluster.location,
          map: map,
          icon: iconPath,
          opacity: 0.3
        });

        gmarkers.push(marker);

        marker.addListener('click', function() {
          var source = cluster.event_source;
          if (source === 'sandbox') {
            netGraphCtrl.createNetGraph(event);
          } else if (event.event_source === 'hashtag') {
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
