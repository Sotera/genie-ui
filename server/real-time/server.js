// def: a socket.io server
var Twit = require('twit'),
    app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = process.env.REALTIME_PORT || 3001;

require('dotenv').load();

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
    var bounds = data.bounds;
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
      if (tweet.coordinates) {
        var coord = {
          lat: tweet.coordinates.coordinates[0],
          lng: tweet.coordinates.coordinates[1]
        };

        socket.broadcast.emit('twitter-stream', coord);

        //Send out to web sockets channel.
        socket.emit('twitter-stream', coord);
      }
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
