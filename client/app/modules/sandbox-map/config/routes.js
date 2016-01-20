'use strict';
angular.module('genie.sandboxMap')
.config(function($stateProvider) {
  $stateProvider
    .state('app.sandbox-map', {
      abstract: true,
      url: '/sandbox-map',
      templateUrl: 'modules/sandbox-map/views/main'
    })
    .state('app.sandbox-map.show', {
      url: '',
      templateUrl: 'modules/sandbox-map/views/map',
      controller: 'SandboxMapCtrl'
    });
});
