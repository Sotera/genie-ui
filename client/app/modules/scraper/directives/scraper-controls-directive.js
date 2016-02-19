'use strict';
angular.module('genie.scraper')

.directive('scraperControls', ['ScraperService',
  function (ScraperService) {

  function link(scope, elem, attrs) {

    var stopWatching = scope.$watch('map', function() {
      if (scope.map) {
        var map = scope.map;
        var controls = map.controls[google.maps.ControlPosition.TOP_RIGHT];
        controls.push(buttons[0]);
        // a one-time change
        stopWatching();
      }
    });

    var buttons = elem.find('.buttons');
    var startbtn = buttons.find('.start');
    var stopbtn = buttons.find('.stop');

    startbtn.click(function() {
      var coords = scope.scraperCoords;
      if (coords && coords.length) {
        ScraperService.start(coords)
        .then(
          function(res) {
            console.log(res);
            scope.scraperId = res.data.scraperId;
          },
          function(err) {
            console.error(err);
          }
        );
      }
    });

    stopbtn.click(function() {
      var scraperId = scope.scraperId;
      if (scraperId) {
        ScraperService.stop(scraperId)
        .then(
          function(res) {
            console.log(res);
            scope.scraperId = null;
          },
          function(err) {
            console.error(err);
          }
        );
      }
    });
  }

  return {
    restrict: 'AE',
    link: link,
    templateUrl: 'modules/scraper/views/scraper-controls'
  };

}]);
