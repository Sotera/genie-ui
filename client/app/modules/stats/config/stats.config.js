'use strict';
angular.module('com.module.stats')
  .run(function ($rootScope, gettextCatalog) {
    $rootScope.addMenu(gettextCatalog.getString(' Stats'), 'app.stats.list','fa-bug');
    $rootScope.addDashboardBox(gettextCatalog.getString(' Stats'), 'bg-blue5', '',
        5, 'app.stats.list','modules/stats/views/chip');

  });
