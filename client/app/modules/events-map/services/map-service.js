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

  function getClusterSources(params) {
    return $http.post('/sourcedataaccess/sourcedata', {events: params})
    .then(function(res) { return res.data; });
  }

  function getZoomLevel(options) {
    return findZoomLevel(options)
    .then(function(zoomLevels) {
      var zoomLevel = zoomLevels[0];
      if (zoomLevel) {
        var clusters = _.sortByOrder(zoomLevel.clusters, 'weight', 'desc');
        zoomLevel.clusters = mapifyClusters(clusters);
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
            // artificial id for UI convenience
            id: cluster.lat.toString() + '-' + cluster.lng.toString(),
            location: new google.maps.LatLng(cluster.lat, cluster.lng),
            weight: cluster.weight,
            events: cluster.events
          };
        })
    }
  }

  return {
    getZoomLevel: getZoomLevel,
    getClusterSources: getClusterSources
  };

}]);
