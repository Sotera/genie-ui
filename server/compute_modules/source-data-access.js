'use strict';
var log = require('debug')('compute_modules:source-data-access');
var loopback = require('loopback');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var _ = require('lodash');

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
        return;
      }
      context.geoTweetHelper.findOne({where:{tweet_id:id}},function(err,source){
        if(!source){
          resolve(null);
          return;
        }

        var tweet = JSON.parse(source.full_tweet);

        var data = {
          text: tweet.text,
          id: tweet.id,
          url: 'https://twitter.com/' + source.username + '/statuses/' + tweet.id_str,
          lat: source.lat,
          lng: source.lng,
          author: source.username,
          image_url: tweet.user.profile_image_url,
          post_date: source.post_date
        };
        resolve(data);
      })
    })
  }

  getEventSourceData(eventInfo){
    var context = this;
    return new Promise(function(resolve,reject){
      if(!eventInfo || eventInfo.event_source != 'hashtag'){
        resolve(null);
        return;
      }
      context.hashtagEventsSourceHelper
      .findOne({where: {event_id: eventInfo.event_id}}, function(err,eventSource){
        if(err || !eventSource){
          resolve(null);
          return;
        }
        var source_data = eventSource.source_data;
        Promise.all(source_data.map(context.getSourceDataById.bind(context)))
        .then(function(result){
          resolve(result);
        })
      })
    })
  }

  post_sourceData(options, cb) {

    options = options || {};
    var events = options.events;

    Promise.all(events.map(this.getEventSourceData.bind(this)))
    .then(result => {
      if (!result || !result.length){
        cb(null, []);
        return;
      }

      // remove nils and flatten
      result = _(result).filter(n => n).flatten();

      cb(null, result);
    })
    .catch(cb);

  }

};
