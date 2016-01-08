'use strict';
angular.module('genie.scraper')

.directive('scraperControls', ['$http',
  function ($http) {

  function link(scope, elem, attrs) {
    var map = scope.map;
    var scrapeButton = document.createElement('div');
    var twitterScrapeButton = document.createElement('div');
    var controls = map.controls[google.maps.ControlPosition.TOP_RIGHT];

    createButton(scrapeButton, { label: '▶', title: 'Start scrape' });
    createButton(twitterScrapeButton, { label: '*', title: 'Add Twitter scrape' });

    twitterScrapeButton.addEventListener('click', function() {
      // console.log(scope.scraperCoords)
      var coords = scope.scraperCoords;
      if (coords && coords.length) {
        $http.post('/startTwitterScrape',
          {
            coords: coords
          })
          .then(
            function(res) {
              console.log(res)
            },
            function(res) {
              console.log(res)
            }
          );
      }
    });
    scrapeButton.addEventListener('click', function() {
      // console.log(scope.scraperCoords)
      var coords = scope.scraperCoords;
      if (coords && coords.length) {
        $http.post('/scrape',
          {
            coords: coords,
            startDate: '2016010100',
            endDate: '2016010300',
            name: 'austin'
          })
          .then(
            function(res) {
              console.log(res)
            },
            function(res) {
              console.log(res)
            }
          );
      }
    });

    controls.push(scrapeButton);
    controls.push(twitterScrapeButton);
  }

  function createButton(container, options) {
    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.marginRight = '8px';
    controlUI.style.textAlign = 'center';
    controlUI.title = options.title;
    container.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = options.label;
    controlUI.appendChild(controlText);
  }

  return {
    link: link
  };
}]);
