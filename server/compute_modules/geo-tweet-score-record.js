'use strict';
var log = require('debug')('compute_modules:geo-tweet-score-record');

module.exports = class {
  constructor(fullTweet) {
    var self = this;
    self.user = fullTweet.user.screen_name;
    self.caption = fullTweet.text;
    self.twitterId = fullTweet.id.toString();
    self.lat = fullTweet.genieLoc.lat;
    self.lng = fullTweet.genieLoc.lng;
    self.tags = fullTweet.entities.hashtags.map(function (hashtag) {
      return hashtag.text;
    });
    self.postDate = new Date(fullTweet.created_at);
    self.indexedDate = new Date();
  }
}

