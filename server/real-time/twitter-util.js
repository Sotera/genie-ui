// def: twitter api response helpers
'use strict';

const _ = require('lodash'),
  log = require('debug')('twitter-util');

module.exports = {
  // get what we need from tweet message
  parseTweet: function parseTweet(tweet) {
    let coord, box, msg, media, images, hashtags;

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

    media = tweet.entities.media;
    hashtags = tweet.entities.hashtags;

    // harvest images from tweet
    if (media && media.length) {
      images = media.filter(m => {
        return m.type == 'photo' && m.media_url;
      });
    } else {
      images = [];
    }

    // just need the text
    hashtags = hashtags.map(tag => tag.text);

    // create a lean return obj
    msg = {
      user: tweet.user, text: tweet.text,
      images: images, hashtags: hashtags
    };

    _.extend(msg, coord);

    return msg;
  }
};
