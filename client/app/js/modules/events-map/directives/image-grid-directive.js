'use strict';
angular.module('genie.eventsMap')
.directive('imageGrid', ['ImageManagerService', '$window', '$compile',
  function(ImageManagerService, $window, $compile) {

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
          showImages({ images, elem, hoverDir, scope });
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
      hoverDir = args.hoverDir,
      scope = args.scope;

    reset(el);

    if (images.length) {
      var frag = $window.document.createDocumentFragment(); // reduces page reflows
      var markup, compiled;
      el.removeClass('hide');

      images.forEach(image => {
        markup = `<img hover-image animate-marker
          class='grid-image' src='${image.image_url}'
          id='${image.id}' hover-dir='${hoverDir}'>`
        compiled = $compile(angular.element(markup))(scope);
        frag.appendChild(compiled[0]);
      });
      container.append(frag);
    }
  }

}]);
