'use strict';
angular.module('genie.eventsMap')
  .factory('tweetService', [
    function() {

    function start (options) {
      console.log(options.bounds)
      if (io !== undefined) {
        // Storage for WebSocket connections
        var socket = io.connect('http://localhost:3001/');

        // This listens on the "twitter-steam" channel and data is
        // received everytime a new tweet is receieved.
        socket.on('twitter-stream', function (data) {

          //Add tweet to the heat map array.
          var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
          liveTweets.push(tweetLocation);

          //Flash a dot onto the map quickly
          // var image = "css/small-dot-icon.png";
          var marker = new google.maps.Marker({
            position: tweetLocation,
            map: map
            // icon: image
          });
          setTimeout(function(){
            marker.setMap(null);
          },600);

        });

        // Listens for a success response from the server to
        // say the connection was successful.
        socket.on('connected', function(r) {

          //Now that we are connected to the server let's tell
          //the server we are ready to start receiving tweets.
          // socket.emit('start tweets');
          console.log('connected')
        });
      }
    }

    return {
      start: start
    };
  }]);
