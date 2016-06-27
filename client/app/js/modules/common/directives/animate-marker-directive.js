'use strict';
angular.module('genie.common')
// click element to show info window. optionally animate related marker.
.directive('animateMarker', ['MarkersService', '$timeout',
  function(MarkersService, $timeout) {

  return {
    link: link
  };

  function link(scope, elem, attrs) {
    elem.click(function() {
      var customId = this.id; // element id must match marker/infowindow customId prop
      // TODO: getItem options should come from attrs
      var marker = MarkersService
        .getItem({ artifact: 'markers', type: 'sources', customId: customId });
      var infowindow = MarkersService
        .getItem({ artifact: 'infowindows', type: 'sources', customId: customId });
      if (marker) {
        if (!infowindow) { // animate marker if no infowindow
          marker.setAnimation(google.maps.Animation.BOUNCE);
          // stop it
          $timeout(() => marker.setAnimation(null), 7 * 1000);
        }

        if (infowindow) {
          infowindow.open(scope.map, marker);
          infowindow.setZIndex(Date.now());
        }
      }
    });
  }
}]);
