'use strict';
angular.module('genie.common')
// add behavior to img node to hover above or below original img
.directive('hoverImage', [function() {

  var $body = $('body'); // abs. position from body

  function link(scope, element, attrs) {
    // image hover orientation: top-left or bottom-right
    var hoverDir = attrs.hoverDir || 'top-left',
      origClass = attrs.class,
      hoverClass = origClass + '-hover';

    element.hover(
      _.debounce(mouseOnImage, 333),
      _.debounce(mouseOffImage, 333)
    );

    function mouseOffImage(evt) {
      $body.find('.' + hoverClass).remove();
    }

    function mouseOnImage(evt) {
      var css = { position: 'absolute', zIndex: 100 };
      if (hoverDir === 'top-left') {
        angular.extend(css, { top: evt.clientY - 150, left: evt.clientX - 150 });
      } else { // bottom-right
        angular.extend(css, { top: evt.clientY, left: evt.clientX });
      }
      var $dupe = $(this.cloneNode(true))
      .removeClass(origClass)
      .addClass(hoverClass)
      .css(css);
      $body.append($dupe);
    }
  }

  return {
    link: link
  }
}]);
