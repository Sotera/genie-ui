'use strict';
angular.module('genie.eventsMap')
.factory('mapService', ['ZoomLevel', '$http', function(ZoomLevel, $http) {

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

  return {
    getZoomLevel: getZoomLevel
  };

}]);

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
