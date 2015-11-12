'use strict';
angular.module('gennie.eventsMap')
  .run(function ($rootScope, gettextCatalog) {
    $rootScope.addMenu('Events Map', 'app.events-map.show','fa-map-marker');
    $rootScope.addDashboardBox('Events Map', 'bg-blue5', 'ion-map',
      5, 'app.events-map.show');

  });
