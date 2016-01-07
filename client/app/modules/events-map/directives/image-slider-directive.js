'use strict';
angular.module('genie.eventsMap')

.directive('imageSlider', ['tweetService', function(tweetService) {

  function link(scope, elem, attrs) {
    scope.$watchCollection(
      function() {
        return tweetService.getImages();
      },
      updateSlider
    );

    function updateSlider(newImages, oldImages) {
      var newImages = _.difference(newImages, oldImages);

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
    var slowReload = _.throttle(imageSlider.reloadSlider, 15000);
  }

  return {
    restrict: 'AE',
    link: link,
    templateUrl: 'modules/events-map/views/image-slider.html'
  };
}]);
