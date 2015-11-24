'use strict';
var app = angular.module('com.module.stats');
app.controller('StatsCtrl', function ($scope, $stateParams, $state, CoreService, gettextCatalog, StatsService) {
  $scope.data = "Just some stats binding here!"
});
