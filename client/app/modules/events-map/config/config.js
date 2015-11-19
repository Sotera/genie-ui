'use strict';
angular.module('genie.eventsMap')
  .run(function ($rootScope) {
    $rootScope.addMenu('Events Map', 'app.events-map.show','fa-map-marker');
    $rootScope.addDashboardBox('Events Map', 'bg-blue5', '',
      5, 'app.events-map.show', 'modules/events-map/views/chipmap');

  });
