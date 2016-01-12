'use strict';
angular.module('genie.geoTwitter', ['uiGmapgoogle-maps'])
  .config(['uiGmapGoogleMapApiProvider', function (uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      v: '3.17'
    });
  }])
  .run(function ($rootScope, gettextCatalog) {
    $rootScope.addMenu('Geo Twitter', 'app.geoTwitter.scraper-list', 'fa-twitter');
    $rootScope.addDashboardBox(gettextCatalog.getString('Geo Twitter'), 'bg-teal', 'ion-social-twitter-outline',
      5, 'app.geoTwitter.scraper-list', 'modules/geo-twitter/views/chip');
  });
