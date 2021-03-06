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
        zoomLevel.clusters = [];
        return zoomLevel; // no record found for zoom or time
      }
    });

    function mapifyClusters(clusters) {
      return _.map(clusters,
        function(cluster) {
          var uiFriendly = {
            // artificial id for UI convenience
            id: cluster.lat.toString() + '-' + cluster.lng.toString(),
            location: new google.maps.LatLng(cluster.lat, cluster.lng),
            start_time: moment(cluster.start_time).format('MM-DD hh:mm a'),
            end_time: moment(cluster.end_time).format('MM-DD hh:mm a')
          };
          return angular.extend(cluster, uiFriendly);
        })
    }
  }

  return {
    getZoomLevel: getZoomLevel,
    getClusterSources: getClusterSources
  };

}]);
