'use strict';
angular.module('genie.geoTwitter', ['uiGmapgoogle-maps','gridster'])
  .config(['uiGmapGoogleMapApiProvider', function (uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      key: 'AIzaSyAkYlCyB4YD2XSoTmSt0-PpVvb7JcQxpvc',
      v: '3.17',
      libraries: 'weather,drawing,geometry,visualization'
    });
  }])
  .run(function ($rootScope, gettextCatalog) {
    $rootScope.addMenu('Geo Twitter', 'app.geoTwitter.scraper-list', 'fa-twitter');
    $rootScope.addDashboardBox(gettextCatalog.getString('Geo Twitter'), 'bg-teal', 'ion-social-twitter-outline',
      5, 'app.geoTwitter.scraper-list', 'modules/geo-twitter/views/chip');
  });
