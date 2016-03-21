#!/usr/bin/env node
'use strict';

var data = require('./OA_PR_JSON.json');
var app = require('../../../server/server');
var request = require('request-json');
var client = request.createClient('http://localhost:3001/api/geocoder/');
var _ = require('lodash');
var GeoTweet = app.models.GeoTweet;

var docs = data.docs;

function requestPromise(loc, defaults /*i.e. {latitude: 0, longitude: 0}*/ ) {
  return new Promise((resolve, reject) => {
    client.post('forward-geo/', { address: loc }, (err, _, body) => {
      // console.log(body)
      if (err) {
        console.log(err);
        // return reject(err);
      }
      if (!body.length) {
        return resolve([defaults]); // echo back defaults if no results
      }
      resolve(body);
    });
  });
}

// geocode all locations in doc
function geocode(doc) {
  var locationNames = doc.locationName;
  var latLngs = doc.latLon; // array of strings matching order of location names

  var geocodePromises = locationNames.map((loc,i) => {
    var latlng = latLngs[i].split(','),
      lat = latlng[0],
      lng = latlng[1];

    // use the first result. TODO: use confidence score if available?
    return requestPromise(loc, {latitude: lat, longitude: lng})
    .then(results => {
      doc.geo = results[0]; // add geo result to original doc
      return doc;
    });
  });

  return Promise.all(geocodePromises);
}

function createGeoTweet(doc) {
  var geo = doc.geo;
  GeoTweet.create({
    username: doc.feedName,
    tweet_id: doc.guid,
    full_tweet: doc.originalTitle,
    post_date: doc.datePublished,
    hashtags: _([doc.feedSource, doc.storySource, doc.all_KeyTag, doc.goWord, doc.locationName])
      .flatten().compact().uniq().value(),
    lat: geo.latitude,
    lng: geo.longitude
  });
}

function tweetify(docs) {
  // create geotweet record for each location (dupes tweet text)
  docs.forEach(createGeoTweet);
}

// collect all geocode-to-geotweet promises
var processDocs = docs.map(doc => {
  return geocode(doc)
  .then(tweetify);
});

Promise.all(processDocs)
.then(() => console.log('done'))
.catch(err => {
  console.error(err);
  GeoTweet.destroyAll();
  console.error('Removing geotweets records');
});
