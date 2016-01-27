'use strict';
angular.module('genie.geoTwitter')
  .controller('GeoTwitterCtrl', function ($scope, $stateParams, $state, $http, CoreService, GeoTwitterScrape, uiGmapGoogleMapApi) {
    uiGmapGoogleMapApi.then(function (maps) {
      $scope.map = {center: {latitude: 30, longitude: -97}, zoom: 8};
    });
    $scope.gridsterOpts = {
      columns: 8, // the width of the grid, in columns
      pushing: true, // whether to push other items out of the way on move or resize
      floating: true, // whether to automatically float items up so they stack (you can temporarily disable if you are adding unsorted items with ng-repeat)
      swapping: false, // whether or not to have items of the same size switch places instead of pushing down if they are the same size
      width: 'auto', // can be an integer or 'auto'. 'auto' scales gridster to be the full width of its containing element
      colWidth: 'auto', // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
      rowHeight: 'match', // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
      margins: [6, 6], // the pixel distance between each widget
      outerMargin: true, // whether margins apply to outer edges of the grid
      isMobile: false, // stacks the grid items if true
      mobileBreakPoint: 600, // if the screen is not wider that this, remove the grid layout and stack the items
      mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
      minColumns: 1, // the minimum columns the grid must have
      minRows: 2, // the minimum height of the grid, in rows
      maxRows: 100,
      defaultSizeX: 1, // the default width of a gridster item, if not specifed
      defaultSizeY: 1, // the default height of a gridster item, if not specified
      minSizeX: 1, // minimum column width of an item
      maxSizeX: null, // maximum column width of an item
      minSizeY: 1, // minumum row height of an item
      maxSizeY: null, // maximum row height of an item
      resizable: {
        enabled: true,
        handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
        start: function (event, $element, widget) {
        }, // optional callback fired when resize is started,
        resize: function (event, $element, widget) {
        }, // optional callback fired when item is resized,
        stop: function (event, $element, widget) {
        } // optional callback fired when item is finished resizing
      },
      draggable: {
        enabled: true, // whether dragging items is supported
        handle: '.my-class', // optional selector for resize handle
        start: function (event, $element, widget) {
        }, // optional callback fired when drag is started,
        drag: function (event, $element, widget) {
        }, // optional callback fired when item is moved,
        stop: function (event, $element, widget) {
        } // optional callback fired when item is finished dragging
      }
    };
    $scope.standardItems = [
      {row: 0, col: 0},
      {row: 0, col: 1},
      {row: 0, col: 2},
      {row: 0, col: 3}
      /*      { sizeX: 2, sizeY: 2, row: 0, col: 0 },
       { sizeX: 2, sizeY: 2, row: 0, col: 1 },
       { sizeX: 2, sizeY: 2, row: 1, col: 0 },
       { sizeX: 2, sizeY: 2, row: 1, col: 1 }*/
      /*      ,{ sizeX: 1, sizeY: 1, row: 0, col: 4 },
       { sizeX: 1, sizeY: 1, row: 0, col: 5 },
       { sizeX: 2, sizeY: 1, row: 1, col: 0 },
       { sizeX: 1, sizeY: 1, row: 1, col: 4 },
       { sizeX: 1, sizeY: 2, row: 1, col: 5 }
       ,{ sizeX: 1, sizeY: 1, row: 2, col: 0 },
       { sizeX: 2, sizeY: 1, row: 2, col: 1 },
       { sizeX: 1, sizeY: 1, row: 2, col: 3 },
       { sizeX: 1, sizeY: 1, row: 2, col: 4 }*/
    ];
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
