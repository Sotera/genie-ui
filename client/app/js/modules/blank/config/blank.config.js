'use strict';
angular.module('com.module.blank')
  .run(function ($rootScope, gettextCatalog) {
    $rootScope.addMenu(gettextCatalog.getString(' Blank'), 'app.blank.list','fa-bug');
    $rootScope.addDashboardBox(gettextCatalog.getString(' Blank'), 'bg-blue5', '',
        5, 'app.blank.list','modules/blank/views/chip');

  });
