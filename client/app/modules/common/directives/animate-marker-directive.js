'use strict';
angular.module('genie.common')
// click element to animate related marker
.directive('animateMarker', ['MarkersService', '$timeout',
  function(MarkersService, $timeout) {

  function link(scope, element, attrs) {
    element.click(function() {
      // TODO: getItem options should come from attrs
      var marker = MarkersService
        .getItem({ artifact: 'markers', type: 'sources', customId: this.id });
      if (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        // stop it
        $timeout(function() { marker.setAnimation(null); }, 7 * 1000);
      }
    });
  }

  return {
    link: link
  }
}]);
