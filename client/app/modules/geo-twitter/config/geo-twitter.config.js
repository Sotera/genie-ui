'use strict';
angular.module('genie.geoTwitter')
  .run(function ($rootScope, gettextCatalog) {
    $rootScope.addMenu('Geo Twitter', 'app.geoTwitter.map', 'fa-twitter');
    $rootScope.addDashboardBox(gettextCatalog.getString('Geo Twitter'), 'bg-teal', 'ion-social-twitter-outline',
      5, 'app.geoTwitter.map', 'modules/geo-twitter/views/chip');
  });
