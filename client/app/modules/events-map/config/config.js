'use strict';
angular.module('gennie.eventsMap')
  .run(function ($rootScope) {
    $rootScope.addMenu('Events Map', 'app.events-map.show','fa-map-marker');
    $rootScope.addDashboardBox('Events Map', 'bg-blue5', 'ion-map',
      5, 'app.events-map.show');

  });

Parse.initialize('LgPQdpbw1cy7DduT6vkOjereXO19eOEUe2G3ux1w', 
  'CgX6WK7wX8Tw99qEq7JRAJjK8I908hQQsaah1WYT');
