'use strict';
angular.module('genie.geoTwitter')
  .controller('GeoTwitterCtrl', function ($scope, $stateParams, $state, $http, CoreService, GeoTwitterScrape, uiGmapGoogleMapApi) {
    uiGmapGoogleMapApi.configure({});
    //Poll to update tweet scrapers
    refreshGetTwitterScraperInfo($scope, GeoTwitterScrape);
    setInterval(function () {
      refreshGetTwitterScraperInfo($scope, GeoTwitterScrape);
    }, 1000);
    //Make ReST interaction more node-like
    $scope.post = function (url, body, cb) {
      cb = cb || function () {
        };
      $http.post(url, body)
        .then(function success(res) {
            cb(null, res);
          },
          function failure(err) {
            cb(res)
          }
        );
    }
    //Supposin' they were to click the scaper play/pause button ...
    $scope.toggleScraperActive = function (scraperId) {
      scraperId = scraperId.id;
      GeoTwitterScrape.findOne({filter: {where: {scraperId}}})
        .$promise
        .then(
          function (geoTwitterScraperInfo) {
            if (geoTwitterScraperInfo.scraperActive) {
              $scope.post('/stopTwitterScrape', {scraperId}, function (err, res) {
              });
            } else {
              $scope.post('/startTwitterScrape', {scraperId}, function (err, res) {
              });
            }
            geoTwitterScraperInfo.scraperActive = !geoTwitterScraperInfo.scraperActive;
            geoTwitterScraperInfo.$save();
          }
        );
    };
    $scope.destroyScrape = function (scraperId) {
      $http.post('/stopTwitterScrape', {scraperId})
        .then(
          function (res) {
            //GeoTwitterScrape.
          },
          function (res) {
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
