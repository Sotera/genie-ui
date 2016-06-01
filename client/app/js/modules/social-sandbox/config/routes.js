'use strict';
angular.module('genie.socialSandbox')
.config(function($stateProvider) {
  $stateProvider
    .state('app.social-sandbox', {
      abstract: true,
      url: '/social-sandbox',
      templateUrl: 'modules/social-sandbox/views/main'
    })
    .state('app.social-sandbox.show', {
      url: '',
      templateUrl: 'modules/social-sandbox/views/map',
      controller: 'SocialSandboxCtrl'
    });
});
