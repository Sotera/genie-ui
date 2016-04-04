#!/usr/bin/env node
'use strict';

var data = require('./OA_PR_JSON.json');
var app = require('../../../server/server');
var request = require('request-json');
var client = request.createClient('http://54.174.131.124:3003/api/geocoder/');
var _ = require('lodash');
var GeoTweet = app.models.GeoTweet;
var syncPromises = require('../../../server/util/generator-promises');

var docs = data.docs;

function requestPromise(loc, defaults /*i.e. {latitude: 0, longitude: 0}*/ ) {
  return new Promise((resolve, reject) => {
    client.post('forward-geo/', { address: loc }, (err, _, body) => {
      if (err) {
        console.error(err);
        // return reject(err);
      }
      if (!body.length) {
        console.log(body)
        return resolve([defaults]); // echo back defaults if no results
      }
      resolve(body);
    });
  });
}

// geocode all locations in doc. saves multiple docs to db: copies of original with
// a geocoded location for each name in locationName.
function geocodeAndSave(doc) {
  var locationNames = doc.locationName;
  var latLngs = doc.latLon; // array of strings matching order of location names

  locationNames.forEach((loc, i) => {
    syncPromises(function* () {
      var latlng = latLngs[i].split(','),
        lat = latlng[0],
        lng = latlng[1];

      // use the first result. TODO: use confidence score if available?
      var results = yield requestPromise(loc, {latitude: lat, longitude: lng});
      doc.geo = results[0]; // add geo result to original doc
      createGeoTweet(doc);
    })()
    .catch(err => {
      console.error(err);
      console.error('Removing geotweets records');
      GeoTweet.destroyAll();
    });
  });
}

function createGeoTweet(doc) {
  var geo = doc.geo;
  GeoTweet.create({
    username: doc.feedName,
    tweet_id: Date.now().toString(), //doc.guid - tweet text duped for locations
    full_tweet: doc.originalTitle,
    post_date: doc.datePublished,
    hashtags: _([doc.feedSource, doc.storySource, doc.all_KeyTag, doc.goWord, doc.locationName])
      .flatten().compact().uniq().value(),
    lat: geo.latitude,
    lng: geo.longitude
  })
  .then(doc => console.log('geotweet created: ', doc.tweet_id))
  .catch(console.error);
}

// geocode, then save each doc to db
docs.forEach(geocodeAndSave);
