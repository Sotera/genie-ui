'use strict';
angular.module('com.module.about')
  /**
   * @ngdoc function
   * @name com.module.about.controller:AboutCtrl
   * @description
   * # AboutCtrl
   * Controller of the clientApp
   */
  .controller('AboutCtrl', ['$scope', 'WebSocketService', function ($scope, WebSocketService) {
    $scope.angular = angular;
/*    WebSocketService.open('time-service', function (socket) {
      //socket.send('pong', {name: 'Fred', serialNum: '1839927dd', age: 8});
      socket.subscribe('tick', function (data) {
        $scope.$apply(function () {
          $scope.testText = data.humanReadable;
        });
      });
    });*/
  }]);
