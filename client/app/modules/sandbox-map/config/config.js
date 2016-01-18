'use strict';
angular.module('genie.sandboxMap')
.run(function ($rootScope) {
  $rootScope.addMenu('Sandbox Trial', 'app.sandbox-map.show','fa-map');
  $rootScope.addDashboardBox('Sandbox Trial', 'bg-blue5', '',
    5, 'app.sandbox-map.show','modules/sandbox-map/views/dash.html');

});
