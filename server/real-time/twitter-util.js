// def: twitter api response helpers
'use strict';

const _ = require('lodash'),
  log = require('debug')('twitter-util');

module.exports = {
  // get what we need from tweet message
  parseTweet: function parseTweet(tweet) {
    let coord, box, msg, media, images;

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
    msg = {user: tweet.user, text: tweet.text, images: images};

    _.extend(msg, coord);

    return msg;
  }
};
