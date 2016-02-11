'use strict';
angular.module('genie.scraper')
.factory('ScraperService', ['$http', function($http) {

  function start(coords) {
    if (!(coords && coords.length)) return;
    console.info('starting...');
    return $http
    .post('/TwitterHashtagClusterer/startTwitterScrape',
      {
        boundingBox: {
          latSouth: coords[0],
          lngWest: coords[1],
          latNorth: coords[2],
          lngEast: coords[3]
        }
      });
  }

  function stop(scraperId) {
    if (!scraperId) return;
    console.info('stopping...');
    return $http
    .post('/TwitterHashtagClusterer/stopTwitterScrape',
      {
        scraperId: scraperId
      });
  }

  return {
    start: start,
    stop: stop
  };

}]);
