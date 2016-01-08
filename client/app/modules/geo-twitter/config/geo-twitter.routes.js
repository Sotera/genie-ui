'use strict';
angular.module('genie.geoTwitter')
  .config(function($stateProvider) {
    $stateProvider
      .state('app.geoTwitter', {
        abstract: true,
        url: '/geo-twitter',
        templateUrl: 'modules/geo-twitter/views/main'
      }).state('app.geoTwitter.scraper-list', {
        url: '',
        templateUrl: 'modules/geo-twitter/views/scraper-list',
        controller: 'GeoTwitterCtrl'
      });
  });
