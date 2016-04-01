'use strict';

module.exports = class {

  post_getSources(options, cb) {
    cb(null,
      [
        {
          text: 'this is awesome #raspi',
          url: 'https://twitter.com/nodejs/status/715973006993072133',
          lat: 18.2428,
          lng: -66.5971,
          screen_name: 'lukewendling'
        },
        {
          text: 'omg i want the echo #raspi',
          url: 'https://twitter.com/nodejs/status/715973006993072133',
          lat: 18.2208,
          lng: -66.5901,
          screen_name: 'lukewendling'
        },
      ]
    );
  }

};
