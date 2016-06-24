'use strict';
angular.module('genie.common')

.directive('geocodeControls', [function() {

  return {
    restrict: 'AE',
    link: link,
    controller: controller,
    templateUrl: 'modules/common/views/geocode-controls'
  };

  function link(scope, elem, attrs) {

    var inputs = elem.find('.inputs');

    var stopWatching = scope.$watch('map', function() {
      if (scope.map) {
        var map = scope.map;
        var controls = map.controls[google.maps.ControlPosition.TOP_LEFT];
        controls.push(inputs[0]);
        // a one-time change
        stopWatching();
      }
    });
  }

  var controller = ['$scope', 'GeocoderService', 'CoreService',
    function($scope, GeocoderService, CoreService) {
      $scope.geocode = { running: false, place: '' };

      $scope.forwardGeocode = function(placeName) {
        $scope.geocode.running = true;
        GeocoderService.forwardGeocode(placeName)
        .then(function(data) {
          $scope.geocode.running = false;
          if (data.total_results > 0) {
            var result = data.results[0]; // use the first for now
            var geo = result.geometry;
            var formatted = result.formatted;
            $scope.geocode.place = formatted;
            $scope.map.setCenter({lat: geo.lat, lng: geo.lng});
            // $scope.map.setZoom(11);
          } else {
            CoreService.alertInfo('No matches', 'Try changing the place name.');
          }
        });
      };
  }];

}]);
