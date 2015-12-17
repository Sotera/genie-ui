'use strict';
var log = require('debug')('util:twitter-client');
var Twitter = require('twitter');

module.exports = class {
  constructor() {
    try{
      var twitterKeyFilename = require('path').join(__dirname, '../../.twitter-keys.json');
      this.twitterKeys = JSON.parse(require('fs').readFileSync(twitterKeyFilename, 'utf8'));
      this.twitterClients = twitterKeys.map(function(twitterKey){
        return new Twitter(twitterKey);
      });
    }catch(err){
      log(err);
    }
  }

  accountSettings(cb) {
    //this.client.get('account/settings', cb);
    log('>>>>> Streaming->');
    var options = {
      stall_warnings: true,
      locations: '-91.71,37.58,-80.54,42.92'
    };
    this.client.stream('statuses/filter', options, function (stream) {
      stream.on('data', function (tweet) {
        log(tweet);
      });

      stream.on('error', function (err) {
        log(err);
      });
    });
  }
}

