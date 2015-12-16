'use strict';
var log = require('debug')('util:twitter-client');
var Twitter = require('twitter');

module.exports = class {
  constructor() {
    var twitterClientOptions = {
      consumer_key: process.env.CONSUMER_KEY,
      consumer_secret: process.env.CONSUMER_SECRET,
      access_token_key: process.env.ACCESS_TOKEN,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET
    };
    this.client = new Twitter(twitterClientOptions);
  }
  accountSettings(cb) {
    this.client.get('account/settings', cb);
  }
}

