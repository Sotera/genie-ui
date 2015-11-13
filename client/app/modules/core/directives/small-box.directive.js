'use strict';
/**
 * @ngdoc directive
 * @name com.module.core.directive:smallbBox
 * @restrict E
 * @description Dashboard Box
 * @param {string} name Box Title
 * @param {string} color Admin-Lte bg-color
 * @param {string} icon Ionic-icon class
 * @param {string} quantity Title
 * @param {string} href ui-shref link
 * @param {string} contentRoute route to display in the inner box
 */
angular.module('com.module.core')
    .directive('smallBox', function($compile) {

      return {
        restrict: 'E',
        templateUrl: 'modules/core/views/elements/small-box',
        scope: {
          name: '@',
          color: '@',
          icon: '@',
          quantity: '@',
          href: '@',
          content:'@'
        },
        link: function(scope, element, attrs){
          var template ='<div style="width:100% height:100%" ng-include="content">';

          var linkFn = $compile(template);
          var content = linkFn(scope);
          angular.element(element[0].querySelector('.inner-behind')).append(content);
        }
      };
    });
