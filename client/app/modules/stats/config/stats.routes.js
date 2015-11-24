'use strict';
angular.module('com.module.stats')
  .config(function($stateProvider) {
    $stateProvider
      .state('app.stats', {
        abstract: true,
        url: '/stats',
        templateUrl: 'modules/stats/views/main'
      }).state('app.stats.list', {
        url: '',
        templateUrl: 'modules/stats/views/list',
        controller: 'StatsCtrl'
      });
  });
