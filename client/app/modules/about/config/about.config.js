'use strict';
angular.module('com.module.about', ['ngWebsocket'])
  .run(function ($rootScope, $websocket, gettextCatalog) {
/*    $rootScope.addDashboardBox(gettextCatalog.getString('About'), 'bg-maroon',
      'ion-information', 0, 'app.about.index', 'modules/about/views/chip');*/
    $rootScope.addDashboardBox(gettextCatalog.getString(''), 'bg-maroon',
      'ion-information', 0, 'app.about.index', 'modules/about/views/chip');
  });
