'use strict';
var log = require('debug')('compute_modules:twitter-hashtag-clusterer');
var loopback = require('loopback');
var LoopbackModelHelper = require('../util/loopback-model-helper');

module.exports = class {

  constructor(app) {
    this.app = app;
    this.geoTweetHelper = new LoopbackModelHelper('GeoTweet');
    this.hashtagEventsSourceHelper = new LoopbackModelHelper('HashtagEventsSource');
  }

  getSourceDataById(id){
    var context = this;
    return new Promise(function(resolve,reject){
      if(!id){
        resolve(null);
      }
      context.geoTweetHelper.findOne({"where":{"tweet_id":id}},function(err,source){
        console.log(source);
        if(!source){
          resolve(null);
        }
        var tweet = JSON.parse(source.full_tweet);

        var data = {
          text: tweet.text,
          id:tweet.id,
          url: 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str,
          lat: source.lat,
          lng: source.lng,
          author: source.username,
          image_url: tweet.user.profile_image_url
        }
        resolve(data);
      })
    })
  }

  getEventSourceData(eventInfo){
    var context = this;
    return new Promise(function(resolve,reject){
      if(!eventInfo){
        resolve(null);
      }
      context.hashtagEventsSourceHelper.findOne({"where":{"event_id":eventInfo.event_id}},function(err,eventSource){
        console.log(eventSource);
        var source_data = eventSource.source_data || ["675586245276254208","675586549531074561","675586293708021760"];
        Promise.all(source_data.map(context.getSourceDataById.bind(context))).then(function(result){
          resolve(result);
        })
      })
    })
  }

  post_sourceData(options, cb) {

    options = options || {};
    var events = options.events || {
        "events":[
          {"event_id":"e517cdf8-fbae-4fba-93d2-493de623c947",
            "event_source":"hashtag"
          }
        ]
      };

    Promise.all(events.map(this.getEventSourceData.bind(this))).then(function(result){
      cb(result);
    })

  }

};
