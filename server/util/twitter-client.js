'use strict';
var log = require('debug')('util:twitter-client');
var Twitter = require('twitter');
var geoDistance = require('geolib');
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

module.exports = class {
  constructor() {
    try {
    } catch (err) {
      log(err);
    }
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
            /*            if (options.onlyWithHashtags && !tweet.entities.hashtags.length) {
             log('No Hashtags');
             return;
             }*/
            if (options.onlyWithCoordinates) {
              if (!tweet.entities.coordinates) {
                //Let's check the 'place' property
                if (!tweet.place || !tweet.place.bounding_box || !tweet.place.bounding_box.coordinates) {
                  return;
                }
                var coords = tweet.place.bounding_box.coordinates;
                if (coords instanceof Array) {
                  if (coords.length == 1 && coords[0] instanceof Array) {
                    var dist = diagonalDistanceOfBoundingBoxInMeters(coords[0]);
                    if(dist < 999){
                      log('We have place coordinates! Dist: ' + dist + ' meters.');
                    }
                  }
                }
              }
              else {
                log('We have tweet coordinates!');
              }
            }
            //log(tweet);
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
  var retVal = geoDistance.getDistance(
    {lat: minLat, lng: minLng},
    {lat: maxLat, lng: maxLng}
  );
  return retVal;
}
