'use strict';
angular.module('genie.eventsMap')
  .factory('mapService', ['ClusteredEvent', 'stylesService', 'tweetService',
    function(ClusteredEvent, stylesService, tweetService) {
    var darkStyles = stylesService.dark;
    var heatmapLayer = new google.maps.visualization.HeatmapLayer();

    function updateMap(map) {
      return function(event) {
        map.setCenter(event.centerPoint);
        heatmapLayer.setMap(map);
        var data = _.map(event.coordinates,
          function(coord) {
            return new google.maps.LatLng(coord.lat, coord.lng);
          });
        heatmapLayer.setData(data);
      }
    }

    function createMap(elem) {
      var mapOptions = {
        zoom: 9,
        center: new google.maps.LatLng(1,1), // insignificant to start
        styles: stylesService.dark
      };

      var map = new google.maps.Map(elem, mapOptions);

      map.addListener('zoom_changed', function() {
        console.log(map.getZoom(), 'zoom')
        focusOnEvent({zoomLevel: map.getZoom(), map: map});
        tweetService.stop();
      });

      return map;
    }

    function focusOnEvent(options) {
      ClusteredEvent.findOne({
        filter: {
          where: {
            zoomLevel: options.zoomLevel
          }
        }
      })
      .$promise
      .then(updateMap(options.map))
      .catch(function(err) {
        console.log(err);
      })
    }

    function displayHeatmap(options) {
      var map = createMap(options.elem);
      focusOnEvent({zoomLevel: options.zoomLevel, map: map});
      return map;
    };

    return {
      displayHeatmap: displayHeatmap,
      darkStyles: darkStyles
    };
  }]);
