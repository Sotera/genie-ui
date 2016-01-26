'use strict';
angular.module('genie.eventsMap')
.factory('mapService', ['ZoomLevel', '$http', function(ZoomLevel, $http) {

  function findZoomLevel(options) {
    return ZoomLevel.find({
      filter: {
        where: {
          zoom_level: options.zoom_level,
          minutes_ago: options.minutes_ago
        }
      }
    })
    .$promise;
  }

  function getZoomLevel(options) {
    return findZoomLevel(options)
    .then(function(zoomLevels) {
      var zoomLevel = zoomLevels[0];
      if (zoomLevel) {
        zoomLevel.clusters = mapifyClusters(zoomLevel.clusters);
        return zoomLevel;
      } else {
        zoomLevel = new ZoomLevel();
        zoomLevel.clusters = []
        return zoomLevel; // no record found for zoom or time
      }
    });

    function mapifyClusters(clusters) {
      return _.map(clusters,
        function(cluster) {
          return {
            location: new google.maps.LatLng(cluster.lat, cluster.lng),
            weight: cluster.weight,
            events: cluster.events
          };
        })
    }
  }

  return {
    getZoomLevel: getZoomLevel
  };

}]);
