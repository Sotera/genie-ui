'use strict';
angular.module('genie.sandboxMap')
.run(function ($rootScope) {
  $rootScope.addMenu('Instagram Events', 'app.sandbox-map.show','fa-map');
  $rootScope.addDashboardBox('Instagram Events', 'bg-blue5', '',
    5, 'app.sandbox-map.show','modules/sandbox-map/views/dash.html');

});
