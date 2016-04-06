// def: a home for long-running processes
importScripts('/bower_components/lodash/lodash.min.js');

var workers = {
  tagCloud: {
    prepare: function(args) {
      // TODO: remove .uniq() once the server has TagCloud api
      var tags = _.uniq(args.tags, 'text');
      postMessage({tags: tags});
    }
  },
  eventsList: {
    prepare: function(args) {
      var events = _.sortByOrder(args.events, 'weight', 'desc');
      postMessage({events: events});
    }
  },
  mapUtil: {
    // locations: objects with lat,lng props.
    // returns object with NE, SW lat,lng props.
    getBoundingBox: function(args) {
      var locations = args.locations,
        len = locations.length,
        sortByLat = _.sortBy(locations, 'lat'),
        sortByLng = _.sortBy(locations, 'lng'),
        minLat = sortByLat[0].lat,
        maxLat = sortByLat[len-1].lat,
        minLng = sortByLng[0].lng,
        maxLng = sortByLng[len-1].lng;

      postMessage({
        bb: {
          ne: { lat: maxLat, lng: maxLng },
          sw: { lat: minLat, lng: minLng }
        }
      });
    }
  }
};

onmessage = function(e) {
  console.log('message received by worker');
  var args = JSON.parse(e.data.args);
  workers[e.data.worker][e.data.method](args);
}

