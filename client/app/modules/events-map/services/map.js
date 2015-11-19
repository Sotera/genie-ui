'use strict';
angular.module('genie.eventsMap')
  .factory('mapService', ['ClusteredEvent', 'stylesService', 
    function(ClusteredEvent, stylesService) {
    var darkStyles = stylesService.dark;
    var elem, zoomLevel;

    function createHeatmap(map, event) {
      new google.maps.visualization.HeatmapLayer({
        data: _.map(event.coordinates, 
          function(coord) {
            return new google.maps.LatLng(coord.lat, coord.lng) 
          }),
        map: map
      });
    }

    function createMap(event) {

      var mapOptions = {
        zoom: zoomLevel,
        center: event.centerPoint,
        styles: stylesService.dark
      };

      var map = new google.maps.Map(elem, mapOptions);
      createHeatmap(map, event);

      map.addListener('zoom_changed', function() {
        console.log(map.getZoom())
      })
    }

    function displayHeatmap(options) {
      elem = options.elem,
      zoomLevel = options.zoomLevel;

      ClusteredEvent.findOne({
        filter: {
          where: {
            zoomLevel: zoomLevel
          }
        } 
      })
      .$promise
      .then(createMap)
      .catch(function(err) {
        console.log(err);
      })
    };

    return {
      displayHeatmap: displayHeatmap,
      darkStyles: darkStyles
    };
  }]);
