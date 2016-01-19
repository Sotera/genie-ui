'use strict';

// to enable these logs set `DEBUG=boot:03-load-content` or `DEBUG=boot:*`
var log = require('debug')('boot:03-load-content');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var loopback = require('loopback');
var async = require('async');
var Random = require('random-js');
var moment = require('moment');
var random = new Random(Random.engines.mt19937().seed(0xc01dbeef));

module.exports = function (app, cb) {
  async.series([
    function (cb) {
      var geoTweetHelper = new LoopbackModelHelper('GeoTweet');
      geoTweetHelper.init({
        scored: false,
        fullTweet: JSON.stringify({}),
        location: new loopback.GeoPoint({lat: 0, lng: 0})
      }, function (err) {
        cb();
      });
    }
    , function (cb) {
      var scoredGeoTweetHelper = new LoopbackModelHelper('ScoredGeoTweet');
      scoredGeoTweetHelper.init({
        user: 'dummy',
        caption: 'dummy',
        twitterId: 'dummy',
        cluster: 'dummy',
        lat: 0,
        lng: 0,
        postDate: new Date(),
        indexedDate: new Date(),
        tags: 'dummy'
      }, function (err) {
        cb();
      });
    }
/*    , function (cb) {
      const randomishPointsOnEarth = [
        {lat: 30.25, lng: -97.5}
        , {lat: 41.8, lng: -87.67}
        , {lat: 39.75, lng: -104.9}
        , {lat: 25.75, lng: -80.2}
      ];
      var scoredGeoTweetHelper = new LoopbackModelHelper('ScoredGeoTweet');
      var refDate = new Date('2016-01-07T20:06:00.000Z');
      var startDate = moment(refDate);
      var endDate = moment(refDate);
      startDate.subtract(5, 'days');
      var geoTweets = [];
      for (var i = 0; i < (8 * 1024); ++i) {
        //twitterId
        var twitterId = random.uuid4().toString();
        twitterId = i.toString();
        //postDate
        var postDate = randomDate(startDate, endDate);
        //lat,lng
        var idx = random.integer(0, randomishPointsOnEarth.length - 1);
        var r = random.real(0.05, 0.5);
        var theta = random.real(0, Math.PI * 2);
        var lat = randomishPointsOnEarth[idx]['lat'] + (r * Math.cos(theta));
        var lng = randomishPointsOnEarth[idx]['lng'] + (r * Math.sin(theta));
        //usernames
        var usernames = ['Fidelity', 'Fifi', 'Fifine', 'Filia', 'Filide', 'Filippa', 'Fina', 'Fiona',
          'Fionna', 'Fionnula', 'Fiorenze', 'Fleur', 'Fleurette', 'Flo', 'Flor', 'Flora'];
        //tags
        const twitterTags = ['indicter', 'abacisci', 'anastrophe', 'pentatomic', 'hyaluronidase', 'canalatura',
          'schizopod', 'undervicar', 'aeciospore', 'iodization', 'newmanism', 'inhibition', 'favelvellae', 'sackbut'];
        var tagArray = [];
        for (var j = 0; j <= random.integer(3, twitterTags.length - 1); ++j) {
          var newTag = twitterTags[random.integer(0, twitterTags.length - 1)]
          if (tagArray.indexOf(newTag) != -1) {
            continue;
          }
          tagArray.push(newTag);
        }
        var tags = tagArray.join(',');
        geoTweets.push(
          {
            user: usernames[random.integer(0, usernames.length - 1)],
            caption: 'dummy',
            cluster: 'dummy',
            twitterId,
            lat,
            lng,
            postDate,
            indexedDate: new Date(),
            tags
          });
      }
      async.forEachOfSeries(geoTweets,
        function (geoTweet, idx, cb) {
          scoredGeoTweetHelper.findOrCreate(
            {
              where: {
                twitterId: geoTweet.twitterId
              }
            },
            geoTweet,
            function (err, results) {
              if (err) {
                log(err);
              }
              cb();
            });
        },
        function () {
          cb();
        }
      );
      /!*      var queries = geoTweets.map(function (geoTweet) {
       return {where: {twitterId: geoTweet.twitterId}};
       });
       scoredGeoTweetHelper.findOrCreateMany(queries, geoTweets, function (err, results) {
       cb();
       });*!/
    }*/
  ], function (err, results) {
    cb();
  });
};

function randomDate(start, end) {
  start = new Date(start);
  end = new Date(end);
  return new Date(start.getTime() + random.real(0, 1, false) * (end.getTime() - start.getTime()));
}
