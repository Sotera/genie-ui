'use strict';
angular.module('genie.eventsMap')
.factory('tweetService', ['ENV', '$timeout', function(ENV, $timeout) {

  var connected = false,
    socket = null;

  // needs a google map object, tweets data store (array),
  // and images data store (array)
  function init(options) {
    var map = options.map,
      tweets = options.tweets,
      images = options.images;

    if (io !== undefined) {
      if (!connected) {
        socket = io.connect(ENV.wsUrl);

        var tweetLocation;

        // listen on the "twitter-steam" channel
        socket.on('twitter-stream', function (tweet) {
          // collect images
          tweet.images.forEach(function(img) { images.push(img) });

          //Add tweet to the heat map array.
          tweetLocation = new google.maps.LatLng(tweet.lng, tweet.lat);
          tweets.push(tweetLocation);

          var marker = new google.maps.Marker({
            position: tweetLocation,
            map: map,
            icon: tweet.user.profile_image_url
          });

          var infowindow = createInfoWindow(tweet);

          marker.addListener('click', function() {
            marker.keep = true; // custom flag: don't auto-remove
            infowindow.open(map, marker);
          });

          // periodically remove marker
          $timeout(function() {
            if (!marker.keep) {
              marker.setMap(null);
              marker = null;
              infowindow = null;
            }
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

  function createInfoWindow(tweet) {
    return new google.maps.InfoWindow({
      maxWidth: 200,
      content: _.template(" \
        <blockquote><%= text %></blockquote> \
        <ul> \
          <li>User: <a href='//twitter.com/<%= screen_name %>' target='_blank'> \
            <%= screen_name %> \
          </a></li> \
          <li>Followers: <%= followers_count %></li> \
          <li>Friends: <%= friends_count %></li> \
        </ul> \
        ")({
          text: tweet.text,
          screen_name: tweet.user.screen_name,
          followers_count: tweet.user.followers_count,
          friends_count: tweet.user.friends_count
        })
    });
  }

  return {
    init: init,
    start: start,
    stop: stop
  };
}]);
