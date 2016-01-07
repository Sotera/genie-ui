'use strict';
angular.module('genie.pinMap')
.controller('PinMapCtrl', ['$scope', '$timeout',
  function ($scope, $timeout) {

    $scope.map = {};
    $scope.data = JSON.stringify([{lat: 0, lng: 0}]);
    var MAX_PINS = 10000,
      markerCluster;

    $scope.changeZoom = function() {
      $scope.map.setZoom(+$scope.zoom);
      console.log($scope.map.getZoom())
    }

    $scope.clearPins = function() {
      $scope.data = JSON.stringify([{}]);
      markerCluster && markerCluster.clearMarkers();
    }

    $scope.createPins = function(event) {
      $scope.pinning = true;
      $timeout(process, 100);

      function process() {
        var json = JSON.parse($scope.data);
        var markers = [];
        var i, item, latLng, marker, lat, lng;
        for (i = 0; i < MAX_PINS; i++) {
          item = json[i];
          if (item) {
            lat = item.lat || item.latitude;
            lng = item.lng || item.longitude;
            latLng = new google.maps.LatLng(lat, lng);
            marker = new google.maps.Marker({
              position: latLng
            });
            markers.push(marker);
          } else {
            break;
          }
        }
        markerCluster = new MarkerClusterer($scope.map, markers);
        $scope.pinning = false;
      }
    }
}]);
