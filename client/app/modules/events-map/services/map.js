'use strict';
angular.module('genie.eventsMap')
  .factory('mapService', ['ZoomLevel', 'stylesService', 'tweetService',
    '$http', 'ENV', 'CoreService', 'mapControlService',
    function(ZoomLevel, stylesService, tweetService, $http, ENV, CoreService,
      mapControlService) {
    var heatmapLayer = new google.maps.visualization.HeatmapLayer(),
      events = [],
      minsInDay = 24*60,
      minutesAgo = minsInDay*5;

    function updateMap(options) {
      var map = options.map;
      return function(zoomLevels) {
        if (zoomLevels.length) {
          var zoomLevel = zoomLevels[0];
          if (options.notCentered) {
            map.setCenter(zoomLevel.centerPoint);
          }
          events = _.map(zoomLevel.events,
            function(event) {
              return {
                location: new google.maps.LatLng(event.lat, event.lng),
                weight: event.weight,
                eventId: event.eventId,
                tag: event.tag
              };
            });
        } else {
          events = [];
        }
        heatmapLayer.setMap(map);
        heatmapLayer.setData(events);
        addMarkers(events, map);
      };
    }

    function getTweets(eventId, onSuccess) {
      // TODO: replace with loopback resource
      $http.post(ENV.tweetsUrl, {
        "query": {
          "in" : {
            "cluster" : [ eventId ],
            "minimum_should_match" : 1
          }
        }
      })
      .then(onSuccess, onError);

      function onError(err) {
        console.log(err);
      }
    }

    function addMarkers(events, map) {
      var marker;
      events.forEach(function addMarker(event) {
        marker = new google.maps.Marker({
          position: event.location,
          map: map,
          opacity: 0.0 // invisible
        });

        marker.addListener('click', function() {
          getTweets(event.eventId, success);
          function success(results) {
            console.log(results.data.hits.hits[0]._source.caption)
            //TODO: show all messages to user
            CoreService.toastInfo('Tweet',
              results.data.hits.hits[0]._source.caption)
          }
        });
      });
    }

    function createMap(elem) {
      var mapOptions = {
        zoom: 5,
        styles: stylesService.dark
      };

      var map = new google.maps.Map(elem, mapOptions);

      map.addListener('zoom_changed', function() {
        console.log(map.getZoom(), 'zoom');
        zoom({zoomLevel: map.getZoom(), map: map});
        tweetService.stop();
      });

      return map;
    }

    function zoom(options) {
      var zoomLevel = options.zoomLevel || options.map.getZoom();
      minutesAgo = +options.minutesAgo || minutesAgo;

      ZoomLevel.find({
        filter: {
          where: {
            zoomLevel: zoomLevel,
            minutesAgo: minutesAgo
          }
        }
      })
      .$promise
      .then(updateMap({map: options.map, notCentered: options.notCentered}),
        function(err) {
          // console.log(err)
        });
    }

    function createControls(map) {
      var slider = mapControlService.createSlider({
        min: 0, max: minsInDay*10, step: minsInDay, value: minutesAgo
      });

      slider.addEventListener('change', function slide(event) {
        minutesAgo = +event.target.value;
        zoom({minutesAgo: minutesAgo, map: map});
        console.log(event.target.value);
      });

      map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(slider);
    }

    function displayHeatmap(options) {
      var map = createMap(options.elem);
      createControls(map);
      // notCentered on initial view
      zoom({zoomLevel: options.zoomLevel, map: map, notCentered: true});
      return map;
    }

    return {
      displayHeatmap: displayHeatmap,
      getEvents: function() { return events; }
    };
  }]);
