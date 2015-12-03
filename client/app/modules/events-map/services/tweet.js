'use strict';
angular.module('genie.eventsMap')
.factory('tweetService', ['ENV', '$timeout', function(ENV, $timeout) {

  var connected = false,
    socket = null;

  // needs a google map object and tweets data store (array)
  function init(options) {
    var map = options.map,
      tweets = options.tweets;

    if (io !== undefined) {
      if (!connected) {
        socket = io.connect(ENV.wsUrl);

        var tweetLocation;

        // listen on the "twitter-steam" channel
        socket.on('twitter-stream', function (data) {
          //Add tweet to the heat map array.
          tweetLocation = new google.maps.LatLng(data.lng, data.lat);
          tweets.push(tweetLocation);

          var marker = new google.maps.Marker({
            position: tweetLocation,
            map: map,
            icon: data.user.profile_image_url
          });

          var infowindow = new google.maps.InfoWindow({
            content: data.text
          });

          marker.addListener('click', function() {
            infowindow.open(map, marker);
          });

          // periodically remove marker
          $timeout(function() {
            marker.setMap(null);
            marker = null;
            infowindow = null;
          },10000);

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
