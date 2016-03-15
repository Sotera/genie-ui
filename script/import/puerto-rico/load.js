#!/usr/bin/env node
'use strict';

var data = require('./OA_PR_JSON.json');
var app = require('../../../server/server');
var _ = require('lodash');
var GeoTweet = app.models.GeoTweet;

var docs = data.docs;

var createGeoTweets = docs.map(doc => {
  var latlng = doc.latLon[0].split(',');
  var lat = +latlng[0],
    lng = +latlng[1];

  return GeoTweet.create({
    username: doc.feedName,
    tweet_id: doc.guid,
    full_tweet: doc.originalTitle,
    post_date: doc.datePublished,
    hashtags: _([doc.feedSource, doc.storySource, doc.all_KeyTag, doc.goWord, doc.locationName])
      .flatten().compact().uniq().value(),
    lat: lat,
    lng: lng
  });
});

Promise.all(createGeoTweets)
.then(() => console.log('done'))
.catch(err => {
  GeoTweet.destroyAll();
  console.error(err);
});
