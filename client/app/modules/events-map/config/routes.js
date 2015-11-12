'use strict';
angular.module('gennie.eventsMap')
  .config(function($stateProvider) {
    $stateProvider
      
      .state('app.events-map', {
        abstract: true,
        url: '/events-map',
        templateUrl: 'modules/events-map/views/main'
      })

      .state('app.events-map.show', {
        url: '',
        templateUrl: 'modules/events-map/views/map',
        controller: 'MapCtrl'
      });
  });
