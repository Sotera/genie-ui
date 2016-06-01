'use strict';
var app = angular.module('com.module.blank');
app.controller('BlankCtrl', function ($scope, $stateParams, $state, CoreService, gettextCatalog, BlankService) {
  $scope.data = "Just some blank binding here!"
});
