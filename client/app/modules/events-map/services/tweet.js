'use strict';
angular.module('genie.eventsMap')
.factory('tweetService', ['ENV', function(ENV) {

  var connected = false,
    socket = null;

  // needs a google map object and liveTweets data store (array)
  function init(options) {
    var map = options.map,
      liveTweets = options.liveTweets;

    if (io !== undefined) {
      if (!connected) {
        socket = io.connect(ENV.wsUrl);

        var tweetLocation, marker;

        // listen on the "twitter-steam" channel
        socket.on('twitter-stream', function (data) {

          //Add tweet to the heat map array.
          tweetLocation = new google.maps.LatLng(data.lng, data.lat);
          liveTweets.push(tweetLocation);

          marker = new google.maps.Marker({
            position: tweetLocation,
            map: map
          });

          // periodically remove marker
          setTimeout(function() {
            marker.setMap(null);
          },600);

        });

        socket.on('connected', function(r) {
          connected = true;
          console.log('connected');
        });
      }
    }
  }

  function start(options) {
    var bounds = boundForTwitter(options.bounds);
    socket.emit('start tweets', {bounds: bounds});
  }

  function stop() {
    socket && socket.emit('stop tweets');
  }

  // twitter wants lng-lat pairs: reorder map.getBounds() output
  function boundForTwitter(mapBounds) {
    var bounds = mapBounds.toUrlValue().split(',');
    return [bounds[1], bounds[0], bounds[3], bounds[2]].join(',');
  }

  return {
    init: init,
    start: start,
    stop: stop
  };
}]);
