'use strict';
angular.module('genie.scraper')
.config(function($stateProvider) {
  $stateProvider
    .state('app.scraper', {
      abstract: true,
      url: '/scraper',
      templateUrl: 'modules/scraper/views/main'
    })
    .state('app.scraper.show', {
      url: '',
      templateUrl: 'modules/scraper/views/map',
      controller: 'ScraperCtrl'
    });
});
