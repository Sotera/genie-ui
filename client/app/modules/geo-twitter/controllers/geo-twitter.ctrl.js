'use strict';
var app = angular.module('genie.geoTwitter');
app.controller('GeoTwitterCtrl', function ($scope, $stateParams, $state, $http, CoreService, GeoTwitterScrape) {
  refreshGetTwitterScraperInfo($scope, GeoTwitterScrape);
  setInterval(function () {
    refreshGetTwitterScraperInfo($scope, GeoTwitterScrape);
  }, 1000);
  $scope.cancelScrape = function(scraperId){
    $http.post('/stopTwitterScrape', { scraperId })
      .then(
        function(res) {
          console.log(res)
        },
        function(res) {
          console.log(res)
        }
      );
  };
});

function refreshGetTwitterScraperInfo(scope, geoTwitterScrape) {
  geoTwitterScrape.find(function (res) {
    res.forEach(function (geoTwitterScraperInfo) {
      var duration = minutes_between(new Date(), new Date(geoTwitterScraperInfo.timeStarted));
      geoTwitterScraperInfo.scrapeDuration = duration;
    });
    scope.safeDisplayedScrapers = res;
    scope.displayedScrapers = [].concat(scope.safeDisplayedScrapers);
  });
}

function minutes_between(date1, date2) {
  // The number of milliseconds in one day
  var ONE_MINUTE = 1000 * 60;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = Math.abs(date1_ms - date2_ms);

  // Convert back to days and return
  return Math.round(difference_ms / ONE_MINUTE);
}
