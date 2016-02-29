'use strict';
angular.module('genie.socialSandbox')
.run(function ($rootScope) {
  $rootScope.addMenu('Social Sandbox', 'app.social-sandbox.show','fa-map-marker');
  $rootScope.addDashboardBox('Social Sandbox', 'bg-blue5', 'ion-map',
    5, 'app.social-sandbox.show', 'modules/social-sandbox/views/dash');
});
