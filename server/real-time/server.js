var twitter = require('twitter'),
    app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = process.env.REALTIME_PORT || 3001;

require('dotenv').load();

var twit = new twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
}),
stream = null;

http.listen(port, () => console.log("Socket.IO server listening on %s", port));

io.on('connection', function (socket) {

  socket.on('start tweets', function(data) {

    if (!stream) {
      //Connect to twitter stream passing in filter for entire world.
      // twit.stream('statuses/filter', {'locations':'-180,-90,180,90'}, function(s) {
      twit.stream('statuses/filter', {locations: data.bounds}, (s) => {
        stream = s;
        stream.on('data', function(data) {
          // Does the JSON result have coordinates
          if (data.coordinates){
            //If so then build up some nice json and send out to web sockets
            var outputPoint = {"lat": data.coordinates.coordinates[0],"lng": data.coordinates.coordinates[1]};

            socket.broadcast.emit('twitter-stream', outputPoint);

            //Send out to web sockets channel.
            socket.emit('twitter-stream', outputPoint);
          }
        });
      });
    }
  });

  // Emits signal to the client telling them that the
  // they are connected and can start receiving Tweets
  socket.emit('connected');

});
