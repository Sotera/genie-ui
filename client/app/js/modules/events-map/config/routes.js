'use strict';
angular.module('genie.eventsMap')
.config(function($stateProvider) {
  $stateProvider
    .state('app.events-map', {
      abstract: true,
      url: '/events-map',
      templateUrl: 'modules/events-map/views/main'
    })
    .state('app.events-map.show', {
      url: '/z/:zoom/c/:center',
      templateUrl: 'modules/events-map/views/map',
      controller: 'EventsMapCtrl'
    })
  ;
});
