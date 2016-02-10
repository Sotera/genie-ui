'use strict';
angular.module('genie.scraper')

.directive('scraperControls', ['$http',
  function ($http) {

  function link(scope, elem, attrs) {
    var map = scope.map;
    // var scrapeButton = document.createElement('div');
    var startTwitBtn = document.createElement('div');
    var stopTwitBtn = document.createElement('div');
    var twitIcon = "<i class='fa fa-lg fa-fw fa-twitter'></i>";
    var stopIcon = "<i class='fa fa-lg fa-fw fa-hand-stop-o'></i>";
    var controls = map.controls[google.maps.ControlPosition.TOP_RIGHT];

    // createButton(scrapeButton, { label: '▶', title: 'Start scrape' });
    createButton(startTwitBtn,
      { label: twitIcon, title: 'Start Twitter scrape' }
    );

    createButton(stopTwitBtn,
      { label: stopIcon, title: 'Stop Twitter scrapes' }
    );

    startTwitBtn.addEventListener('click', function() {
      var coords = scope.scraperCoords;
      console.log(coords)
      if (coords && coords.length) {
        $http.post('/TwitterHashtagClusterer/startTwitterScrape',
          {
            boundingBox: {
              lngWest: coords[1],
              latSouth: coords[0],
              lngEast: coords[3],
              latNorth: coords[2]
            }
          })
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

    stopTwitBtn.addEventListener('click', function() {
      $http.post('/TwitterHashtagClusterer/stopTwitterScrape',
        {
          scraperId: scope.scraperId
        })
        .then(
          function(res) {
            console.log(res);
            scope.scraperId = null;
          },
          function(err) {
            console.error(err);
          }
        );
    });
    // scrapeButton.addEventListener('click', function() {
    //   var coords = scope.scraperCoords;
    //   console.log(coords)
    //   if (coords && coords.length) {
    //     $http.post('/scrape',
    //       {
    //         coords: coords,
    //         startDate: '2016010100',
    //         endDate: '2016010300',
    //         name: 'austin'
    //       })
    //       .then(
    //         function(res) {
    //           console.log(res)
    //         },
    //         function(res) {
    //           console.log(res)
    //         }
    //       );
    //   }
    // });

    // controls.push(scrapeButton);
    controls.push(stopTwitBtn);
    controls.push(startTwitBtn);
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
