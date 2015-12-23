// def: a socket.io server
var Twit = require('twit'),
    app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    _ = require('lodash'),
    port = process.env.REALTIME_PORT || 3001;

require('dotenv').load();

if (!process.env.CONSUMER_KEY) {
  console.log('Cannot continue: missing Twitter config in .env file.');
  process.exit();
}

var twit = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
}),
stream = null;

http.listen(port, () => console.log("Socket.IO server listening on %s", port));

io.on('connection', socket => {

  socket.on('start tweets', data => {
    var bounds = data.bounds,
    coord, box, base, media, images;

    console.log(bounds);

    // stream.start() could work if it accepted params
    stream = twit.stream('statuses/filter', {locations: bounds});

    stream.on('error', err => {
      console.log(err.code, err.message);
    });

    stream.on('limit', msg => {
      console.log(msg);
    });

    stream.on('connected', res => {
      console.log('connected');
    });

    stream.on('disconnect', msg => {
      console.log(msg);
    });

    stream.on('tweet', tweet => {
      console.log(tweet);
      if (tweet.coordinates) { // exact location
        coord = {
          lat: tweet.coordinates.coordinates[0],
          lng: tweet.coordinates.coordinates[1]
        };
      } else { // fallback to place obj
        // TODO: for now, just get one of the box coords
        box = tweet.place.bounding_box.coordinates[0][0];
        coord = {
          lat: box[0],
          lng: box[1]
        };
      }

      console.log('*********', coord)

      // harvest images from tweet
      media = tweet.entities.media;

      if (media && media.length) {
        images = media.filter(m => {
          return m.type == 'photo' && m.media_url;
        });
      } else {
        images = [];
      }

      // create a lean return obj
      base = {user: tweet.user, text: tweet.text, images: images};

      _.extend(base, coord);

      socket.broadcast.emit('twitter-stream', base);

      //Send out to web sockets channel.
      socket.emit('twitter-stream', base);
    });
  });

  socket.on('stop tweets', () => {
    console.log('stop tweets');
    stream && stream.stop();
  });
  // Emits signal to the client telling them that the
  // they are connected and can start receiving Tweets
  socket.emit('connected');

});
