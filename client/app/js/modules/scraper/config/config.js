'use strict';
angular.module('genie.scraper')
.run(function ($rootScope) {
  $rootScope.addMenu('Scraper', 'app.scraper.show','fa-map');
  $rootScope.addDashboardBox('Scraper', 'bg-blue5', 'ion-code-download',
    5, 'app.scraper.show','modules/scraper/views/dash');
});
