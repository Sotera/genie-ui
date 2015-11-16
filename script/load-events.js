'use strict';

var loopback = require('loopback');
var app = require('../server/server.js');
var Event = app.models.Event;
var events = require('./events.json');
var log = require('debug')('load-events');


// load mock events from file
var loader = module.exports = function loader() {
  var geo;
  Event.destroyAll();
  
  events.forEach(function(event) {
    geo = loopback.GeoPoint({
      lat: event.geo[0],
      lng: event.geo[1]
    });
    Event.create({
        coordinates: [geo],
        name: '#somethingexciting'
      },
      function(err, event) {
        log(err || event);
      })
  });
};

// start immediately if run via `$ node <script>`
if (require.main === module) {
  loader();
}