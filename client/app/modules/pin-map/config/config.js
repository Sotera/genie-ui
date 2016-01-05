'use strict';
angular.module('genie.pinMap')
.run(function ($rootScope) {
  $rootScope.addMenu('Pin Map', 'app.pin-map.show','fa-map-pin');
  $rootScope.addDashboardBox('Pin Map', 'bg-blue5', '',
    5, 'app.pin-map.show','modules/pin-map/views/dash.html');

});
