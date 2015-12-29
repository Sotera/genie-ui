'use strict';
var log = require('debug')('util:twitter-client');
var Twitter = require('twitter');
var loopback = require('loopback');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var apiCheck = require('api-check')({
  output: {
    prefix: 'compute_modules:clustered-event-source-helper',
    docsBaseUrl: 'http://www.example.com/error-docs#'
  },
  verbose: false
});

var twitterKeyFilename = require('path').join(__dirname, '../../.twitter-keys.json');
var twitterKeys = JSON.parse(require('fs').readFileSync(twitterKeyFilename, 'utf8'));
var inUseTwitterClients = [];
var freeTwitterClients = twitterKeys.map(function (twitterKey) {
  return new Twitter(twitterKey);
});

var geoTweetHelper = new LoopbackModelHelper('GeoTweet');

module.exports = class {
  constructor() {
  }

  scoreNextGeoTweet(cb){
    geoTweetHelper.findOne({where: {scored: false}}, function(err, tweet){
      if(err){
        cb(err);
        return;
      }
      //Now shall we score the tweet
      tweet.updateAttribute('scored', true, function(err, tweet){
        cb(null);
      });
    });
  }

  captureTweetsByLocation(options, cb) {
    apiCheck.throw([apiCheck.shape({
      onlyWithHashtags: apiCheck.bool
      , onlyWithCoordinates: apiCheck.bool
      , boundingBoxLatSouth: apiCheck.number
      , boundingBoxLatNorth: apiCheck.number
      , boundingBoxLngWest: apiCheck.number
      , boundingBoxLngEast: apiCheck.number
    }), apiCheck.func], arguments);
    if (freeTwitterClients.length) {
      var locations = options.boundingBoxLngWest.toString();
      locations += ',' + options.boundingBoxLatSouth.toString();
      locations += ',' + options.boundingBoxLngEast.toString();
      locations += ',' + options.boundingBoxLatNorth.toString();
      var twitterClientStreamOptions = {
        stall_warnings: true,
        locations
      };
      var twitterClient = null;
      inUseTwitterClients.push(twitterClient = freeTwitterClients.pop());
      twitterClient.stream('statuses/filter', twitterClientStreamOptions, function (stream) {
        stream.twitterClient = twitterClient;
        //MonkeyPatch stream.destroy to emit 'end' event
        var oldDestroy = stream.destroy;
        stream.destroy = function () {
          oldDestroy();
          stream.emit('end');
        }
        //Sign up for stream events we care about
        stream.on('data', function (tweet) {
          try {
            //Hashtags check is quicker so do it first
            if (options.onlyWithHashtags &&
              (!tweet.entities || !tweet.entities.hashtags || !tweet.entities.hashtags.length)) {
              log('No Hashtags');
              return;
            }
            if (options.onlyWithCoordinates) {
              if (tweet.geo) {
                if (tweet.geo.type === 'Point') {
                  if (tweet.geo.coordinates && tweet.geo.coordinates.length == 2) {
                    tweet.genieLoc = {lng: tweet.geo.coordinates[1], lat: tweet.geo.coordinates[0]};
                  }
                }
              }
              if (!tweet.genieLoc && tweet.coordinates) {
                tweet.genieLoc = {lng: tweet.coordinates[0], lat: tweet.coordinates[1]};
              }
              //Let's check the 'place' property
              if (!tweet.genieLoc && tweet.place && tweet.place.bounding_box && tweet.place.bounding_box.coordinates) {
                var coords = tweet.place.bounding_box.coordinates;
                if (coords instanceof Array) {
                  if (coords.length == 1 && coords[0] instanceof Array) {
                    var distanceInfo = diagonalDistanceOfBoundingBoxInMeters(coords[0]);
                    if (distanceInfo.distanceMeters < options.maxPlaceSizeMeters) {
                      tweet.genieLoc = {lng: distanceInfo.center.lng, lat: distanceInfo.center.lat};
                    }
                  }
                }
              }
              if (!tweet.genieLoc) {
                return;
              }
              log('We have coordinates! CenterPoint: [' + tweet.genieLoc.lng + ',' + tweet.genieLoc.lat + ']');
            }
            //Save-o the Tweet-o!
/*            geoTweetHelper.find(function(err,geoTweets){
              var gt = geoTweets;
            });*/
/*            var connector = geoTweetHelper.getModel().getDataSource().connector;
            var cc = connector.getClientConfig();*/
            geoTweetHelper.create({
              location: tweet.genieLoc,
              scored: false,
              fullTweet: JSON.stringify(tweet)
            });
          } catch (err) {
            log(err);
          }
        });
        stream.on('end', function () {
          var idxToRemove = inUseTwitterClients.indexOf(this.twitterClient);
          freeTwitterClients = freeTwitterClients.concat(inUseTwitterClients.splice(idxToRemove, 1));
        });
        stream.on('error', function (err) {
          log(err);
        });
        cb(null, stream);
      });
    } else {
      throw new Error('All TwitterClients in use!');
    }
  }
}

function diagonalDistanceOfBoundingBoxInMeters(coords) {
  var minLng = Number.MAX_SAFE_INTEGER;
  var maxLng = Number.MIN_SAFE_INTEGER;
  var minLat = Number.MAX_SAFE_INTEGER;
  var maxLat = Number.MIN_SAFE_INTEGER;
  coords.forEach(function (coord) {
    minLng = coord[0] < minLng ? coord[0] : minLng;
    maxLng = coord[0] > maxLng ? coord[0] : maxLng;
    minLat = coord[1] < minLat ? coord[1] : minLat;
    maxLat = coord[1] > maxLat ? coord[1] : maxLat;
  });
  var loc0 = new loopback.GeoPoint({lat: minLat, lng: minLng});
  var loc1 = new loopback.GeoPoint({lat: maxLat, lng: maxLng});
  var distanceMeters = loopback.GeoPoint.distanceBetween(loc0, loc1, {type: 'meters'});
  return {distanceMeters, center: {lng: (maxLng + minLng) / 2, lat: (maxLat + minLat) / 2}};
}
