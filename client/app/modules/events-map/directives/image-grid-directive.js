'use strict';
angular.module('genie.eventsMap')
.directive('imageGrid', ['ImageManagerService', '$window',
  function(ImageManagerService, $window) {

  var $body = $('body');

  function link(scope, elem, attrs) {
    // selected or unselected
    var imageType = attrs.imageType;
    // image hover orientation: top-left or bottom-right
    var hoverDir = attrs.hoverDir || 'top-left';

    scope.$watchCollection(
      function() {
        return ImageManagerService.getImages(imageType);
      },
      function() {
        var images = ImageManagerService.getImages(imageType);
        if (images.length) {
          showImages({
            images: images,
            elem: elem,
            hoverDir: hoverDir
          });
        } else {
          reset(elem);
        }
      }
    );

    scope.$watch('inputs.minutes_ago', function() {
      ImageManagerService.clear(imageType);
    });
  }

  function getContainer(elem) {
    return $(elem.children()[0]);
  }

  function reset(elem) {
    var container = getContainer(elem);
    container.empty(); // clean slate
    elem.addClass('hide'); // hide element
  }

  function showImages(args) {
    var images = args.images,
      el = args.elem,
      container = getContainer(el),
      hoverDir = args.hoverDir;

    reset(el);

    if (images.length) {
      var frag = $window.document.createDocumentFragment(), // reduces page reflows
        img;
      el.removeClass('hide');
      images.forEach(function(image) {
        img = $window.document.createElement('img');
        img.className = 'grid-image';
        img.id = image.nodeId;
        img.src = image.url;
        $(img).hover(
          _.debounce(mouseOnImage, 333),
          _.debounce(mouseOffImage, 333)
        );
        frag.appendChild(img);
      });
      container.append(frag);
    }

    function mouseOffImage(evt) {
      $body.find('.grid-image-hover').remove();
    }

    function mouseOnImage(evt) {
      var css = {position: 'absolute', zIndex: 100};
      if (hoverDir === 'top-left') {
        angular.extend(css, {top: evt.clientY - 150, left: evt.clientX - 150});
      } else { // bottom-right
        angular.extend(css, {top: evt.clientY, left: evt.clientX});
      }
      var $dupe = $(this.cloneNode(true))
      .removeClass('grid-image')
      .addClass('grid-image-hover')
      .css(css);
      $body.append($dupe);
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
        };
    }]
  };
}]);
