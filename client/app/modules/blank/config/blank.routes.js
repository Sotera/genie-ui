'use strict';
angular.module('com.module.blank')
  .config(function($stateProvider) {
    $stateProvider
      .state('app.blank', {
        abstract: true,
        url: '/blank',
        templateUrl: 'modules/blank/views/main'
      }).state('app.blank.list', {
        url: '',
        templateUrl: 'modules/blank/views/list',
        controller: 'BlankCtrl'
      });
  });
