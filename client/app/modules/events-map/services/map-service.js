'use strict';
angular.module('genie.eventsMap')
  .factory('mapService', ['ZoomLevel', '$http',
    function(ZoomLevel, $http) {
      var events = [],
      minsInDay = 24*60,
      minutesAgo = minsInDay*5;

    // function getTweets(eventId, onSuccess) {
    //   // TODO: replace with loopback resource
    //   $http.post(ENV.tweetsUrl, {
    //     "query": {
    //       "in" : {
    //         "cluster" : [ eventId ],
    //         "minimum_should_match" : 1
    //       }
    //     }
    //   })
    //   .then(onSuccess, onError);

    //   function onError(err) {
    //     console.log(err);
    //   }
    // }

    // function addMarkers(events, map) {
    //   var marker;
    //   events.forEach(function addMarker(event) {
    //     marker = new google.maps.Marker({
    //       position: event.location,
    //       map: map,
    //       opacity: 0.0 // invisible
    //     });

    //     marker.addListener('click', function() {
    //       // getTweets(event.eventId, success);
    //       function success(results) {
    //         console.log(results.data.hits.hits[0]._source.caption)
    //         //TODO: show all messages to user
    //         CoreService.toastInfo('Tweet',
    //           results.data.hits.hits[0]._source.caption)
    //       }
    //     });
    //   });
    // }

    // function createMap(elem) {
    //   var mapOptions = {
    //     zoom: 5,
    //     styles: stylesService.dark
    //   };

    //   var map = new google.maps.Map(elem, mapOptions);

    //   map.addListener('zoom_changed', function() {
    //     console.log(map.getZoom(), 'zoom');
    //     changeFocus({zoomLevel: map.getZoom(), map: map});
    //     tweetService.stop();
    //   });

    //   return map;
    // }

    function findZoomLevel(options) {
      return ZoomLevel.find({
        filter: {
          where: {
            zoomLevel: options.zoomLevel,
            minutesAgo: options.minutesAgo
          }
        }
      })
      .$promise;
    }

    function getZoomLevel(options) {
      return findZoomLevel(options)
      .then(function(zoomLevels) {
        var zoomLevel = zoomLevels[0];
        if (zoomLevels.length) {
          zoomLevel.events = parseEvents(zoomLevel.events);
          return zoomLevel;
        } else {
          zoomLevel = new ZoomLevel();
          zoomLevel.events = []
          return zoomLevel; // no record found for zoom or time
        }
      });

      function parseEvents(events) {
        return _.map(events,
          function(event) {
            return {
              location: new google.maps.LatLng(event.lat, event.lng),
              weight: event.weight,
              eventId: event.eventId,
              tag: event.tag
            };
          })
      }
    }

    // function createControls(map) {
    //   var slider = mapControlService.createSlider({
    //     min: 0, max: minsInDay*10, step: minsInDay, value: minutesAgo
    //   });

    //   slider.addEventListener('change', function slide(event) {
    //     minutesAgo = +event.target.value;
    //     changeFocus({minutesAgo: minutesAgo, map: map});
    //     console.log(event.target.value);
    //   });

    //   map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(slider);
    // }

    return {
      // displayHeatmap: displayHeatmap,
      // getEvents: function() { return events; },
      getZoomLevel: getZoomLevel
    };
  }]);
