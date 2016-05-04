#!/usr/bin/env node
'use strict';

// points are often exact same location so randomly modify lat,lng

var app = require('../../../server/server');
// var _ = require('lodash');
var GeoTweet = app.models.GeoTweet;

GeoTweet.find()
.then(randomize)
.catch(console.error);

function randomize(tweets) {
  tweets.forEach(t => {
    var offsetLat = Math.random();
    var offsetLng = Math.random();
    var sign = Math.random() <= 0.5 ? -1 : 1; // pos or neg
    t.lat = offsetLat * sign / 100 + t.lat;
    t.lng = offsetLng * sign / 100 + t.lng;
    t.save().then(obj => console.log('updated', obj.id));
  });
}
