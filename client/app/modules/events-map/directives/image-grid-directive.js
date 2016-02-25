'use strict';
angular.module('genie.eventsMap')
.directive('imageGrid', ['ImageManagerService', '$window',
  function(ImageManagerService, $window) {

  function link(scope, elem, attrs) {
    var imageType = attrs.imageType;

    scope.$watchCollection(
      function() {
        return ImageManagerService.getImages(imageType);
      },
      function() {
        var images = ImageManagerService.getImages(imageType);
        if (images.length) {
          showImages({
            images: images,
            elem: elem
          });
        }
      }
    );
  }

  function showImages(args) {
    var images = args.images,
      el = args.elem,
      container = $(el.children()[0]);

    container.empty(); // clean slate

    if (images.length) {
      var frag = $window.document.createDocumentFragment(), // reduces page reflows
        img;
      el.removeClass('hide');
      images.forEach(function(image) {
        img = $window.document.createElement('img');
        img.className = 'grid-image';
        img.id = image.nodeId;
        img.src = image.url;
        img.addEventListener('click',
          function() { $window.open(image.url); });
        frag.appendChild(img);
      });
      container.append(frag);
    }
  }

  return {
    restrict: 'E',
    link: link,
    template: '<div style="padding-bottom:15px;height:100%;overflow:auto"></div>',
    controller: ['$scope', 'ImageManagerService',
      function($scope, ImageManagerService) {
        $scope.clearImages = function(type) {
          ImageManagerService.clear(type);
          $scope.$apply();
        }
    }]
  };
}]);
