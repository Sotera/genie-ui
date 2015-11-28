'use strict';
angular.module('genie.eventsMap')
  .factory('mapService', ['ClusteredEvent', 'stylesService', 'tweetService',
    function(ClusteredEvent, stylesService, tweetService) {
    var darkStyles = stylesService.dark;
    var heatmapLayer = new google.maps.visualization.HeatmapLayer();

    function updateMap(options) {
      var map = options.map;
      return function(event) {
        if (options.notCentered) {
          map.setCenter(event.centerPoint);
        }
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
        styles: stylesService.dark
      };

      var map = new google.maps.Map(elem, mapOptions);

      map.addListener('zoom_changed', function() {
        console.log(map.getZoom(), 'zoom');
        focusOnEventCluster({zoomLevel: map.getZoom(), map: map});
        tweetService.stop();
      });

      return map;
    }

    function focusOnEventCluster(options) {
      ClusteredEvent.findOne({
        filter: {
          where: {
            zoomLevel: options.zoomLevel
          }
        }
      })
      .$promise
      .then(updateMap({map: options.map, notCentered: options.notCentered}))
      .catch(function(err) {
        console.log(err);
      });
    }

    function displayHeatmap(options) {
      var map = createMap(options.elem);
      // notCentered on initial view
      focusOnEventCluster({zoomLevel: options.zoomLevel, map: map, notCentered: true});
      return map;
    }

    return {
      displayHeatmap: displayHeatmap,
      darkStyles: darkStyles
    };
  }]);
