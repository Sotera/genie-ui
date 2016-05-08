#!/usr/bin/env node

// run from project root

'use strict';

const app = require('../../../server/server'),
  GeoTweet = app.models.GeoTweet,
  fs = require('fs'),
  // JSONStream = require('JSONStream'),
  es = require('event-stream'),
  infile = '../uk-2015-06-20-tweets.json',
  readline = require('readline'),
  _ = require('lodash');

GeoTweet.destroyAll()
.then(load)
// .then(() => console.log('done'))
.catch(console.error);

function load() {
  const lineReader = readline.createInterface({
    input: require('fs').createReadStream(infile),
    terminal: false
  });

  lineReader
  .on('line', line => {
    save(line);
  })
  .on('error', console.error);
}

function save(tweet) {
  tweet = JSON.parse(tweet)
  // gnip format doesn't expose tweet.id by itself so extract it
  const tweetId = tweet.id.match(/:([0-9]+$)/)[1];
  let hashtags = tweet.twitter_entities.hashtags;

  if (!hashtags.length) return;

  hashtags = hashtags.map(h => h.text.toLowerCase());

  const geotweet = {
    lat: tweet.geo.coordinates[0],
    lng: tweet.geo.coordinates[1],
    post_date: new Date(tweet.postedTime),
    tweet_id: tweetId,
    username: tweet.actor.preferredUsername,
    full_tweet: JSON.stringify({
      id: tweetId, id_str: tweetId, text: tweet.body, user: {
        profile_image_url: tweet.actor.image
      },
    }),
    hashtags
  };
  GeoTweet.create(geotweet)
    .then(g => console.log('GeoTweet', g.id, 'created'))
    .catch(console.error);
}
