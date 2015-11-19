'use strict';
angular.module('genie.eventsMap')
  .factory('mapService', ['ClusteredEvent', 'stylesService', 
    function(ClusteredEvent, stylesService) {
    var darkStyles = stylesService.dark;
    var elem, zoomLevel;

    function updateMap(map) {
      return function(event) {
        map.setCenter(event.centerPoint);
        new google.maps.visualization.HeatmapLayer({
          data: _.map(event.coordinates, 
            function(coord) {
              return new google.maps.LatLng(coord.lat, coord.lng) 
            }),
          map: map
        });
      }
    }

    function createMap(elem) {

      var mapOptions = {
        zoom: 9,
        center: new google.maps.LatLng(-25.363882, 131.044922),
        styles: stylesService.dark
      };

      var map = new google.maps.Map(elem, mapOptions);

      map.addListener('zoom_changed', function() {
        console.log(map.getZoom(), 'zoom')
        focusOnEvent({zoomLevel: map.getZoom(), map: map});
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
    };

    return {
      displayHeatmap: displayHeatmap,
      darkStyles: darkStyles
    };
  }]);
