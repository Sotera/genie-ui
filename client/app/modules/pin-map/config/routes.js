'use strict';
angular.module('genie.pinMap')
.config(function($stateProvider) {
  $stateProvider
    .state('app.pin-map', {
      abstract: true,
      url: '/pinmap',
      templateUrl: 'modules/pin-map/views/main'
    })
    .state('app.pin-map.show', {
      url: '',
      templateUrl: 'modules/pin-map/views/map',
      controller: 'PinMapCtrl'
    });
});
