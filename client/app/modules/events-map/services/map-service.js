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
            tag: event.tag,
            eventSource: event.eventSource
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


