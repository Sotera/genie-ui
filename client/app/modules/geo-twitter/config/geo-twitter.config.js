'use strict';
angular.module('genie.geoTwitter')
  .run(function ($rootScope, gettextCatalog) {
    $rootScope.addMenu('Geo Twitter', 'app.geoTwitter.scraper-list', 'fa-twitter');
    $rootScope.addDashboardBox(gettextCatalog.getString('Geo Twitter'), 'bg-teal', 'ion-social-twitter-outline',
      5, 'app.geoTwitter.scraper-list', 'modules/geo-twitter/views/chip');
  });
