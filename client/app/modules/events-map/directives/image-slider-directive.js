'use strict';
angular.module('genie.eventsMap')

.directive('imageSlider', [function () {

  function link(scope, elem, attrs) {
    scope.$watchCollection(
      function(scope) {
        return scope.images;
      },
      updateSlider
    );

    function updateSlider(newColl, oldColl) {
      var newImages = _.difference(newColl, oldColl);

      if (newImages.length) {
        newImages.forEach(function(image) {
          $slider.append('<li><a href="' + image.media_url +
            '" target="_blank"><img src="' + image.media_url + '"></a></li>');
        });
        slowReload();
      }
    }

    var $slider = elem.find('.bxslider');

    var imageSlider = $slider.bxSlider({
      minSlides: 4,
      maxSlides: 4,
      slideWidth: 200,
      slideMargin: 10,
      ticker: true,
      tickerHover: true,
      speed: 12000
    });

    // tried a simple $interval scheduler but it doesn't play nicely. don't know...
    var slowReload = _.debounce(imageSlider.reloadSlider, 15000);
  }

  return {
    restrict: 'AE',
    link: link,
    templateUrl: 'modules/events-map/views/image-slider.html'
  };
}]);
