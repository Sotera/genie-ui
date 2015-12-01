'use strict';
angular.module('genie.eventsMap')
  .run(function ($rootScope) {
    $rootScope.addMenu('Events', 'app.events-map.show','fa-map-marker');
    $rootScope.addDashboardBox('Events', 'bg-blue5', '',
      5, 'app.events-map.show', 'modules/events-map/views/chipmap');

  });
