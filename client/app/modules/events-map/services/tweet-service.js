'use strict';
angular.module('genie.eventsMap')
.factory('tweetService', ['ENV', '$timeout', function(ENV, $timeout) {

  var connected = false,
    socket = null,
    images = [], //just a simple array. getters, setters defined here.
    tweets = new google.maps.MVCArray(); // provides own getters, setters.

  // needs a google map object.
  // TODO: move map marker creation to another service or directive?
  function init(options) {
    var map = options.map;

    if (io !== undefined) {
      if (!connected) {
        socket = io.connect(ENV.wsUrl);

        var tweetLocation;

        // listen on the "twitter-steam" channel
        socket.on('twitter-stream', function (tweet) {
          addImages(tweet.images);

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

  // add images to store and truncate as needed.
  function addImages(newImages) {
    if (newImages.length) {
      var max = 20;
      if (images.length > max) {
        images = images.slice(max*-1)
      }
      images = images.concat(newImages);
    }
  }

  function getImages() {
    return images;
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
    stop: stop,
    getImages: getImages,
    tweets: tweets
  };
}]);
