'use strict';
angular.module('genie.scraper')

.directive('instagramImages', [function() {

  function link(scope, elem, attrs) {
    scope.$watchCollection(
      function() {
        return scope.instagramThumbs;
      },
      updateImages
    );

    var $images = elem.find('#images');

    function updateImages(newImages, _) {
      $images.empty(); // clear previous nodes

      if (newImages.length) {
        newImages.forEach(function(image) {
          $images.append('<a href="' + image.url +
            '" target="_blank"><img class="thumb" src="'
            + image.url + '"></a>');
        });
      }
    }
  }

  return {
    restrict: 'AE',
    link: link,
    templateUrl: 'modules/scraper/views/instagram-images.html'
  };
}]);
