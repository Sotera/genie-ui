'use strict';
var app = angular.module('genie.geoTwitter');
app.controller('GeoTwitterCtrl', function ($scope, $stateParams, $state, CoreService, gettextCatalog, GeoTwitterScrape) {
  GeoTwitterScrape.find(function (res) {
    $scope.safeDisplayedScrapers = res;
    $scope.displayedScrapers = [].concat($scope.safeDisplayedScrapers);
  });
});
