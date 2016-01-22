'use strict';
angular.module('genie.eventsMap')
.directive('heatMap', ['CoreService', 'ENV', '$http','SandboxEventsSource',
  'ImageManagerService',
  function(CoreService, ENV, $http, SandboxEventsSource, ImageManagerService) {

  function link(scope, elem, attrs) {
    var gmarkers = []; // needed to remove markers on input change
    var heatmapLayer = new google.maps.visualization.HeatmapLayer(
      {
        radius: attrs.radius || 24
      });

    scope.$watchCollection(
      function(scope) {
        return scope.zoomLevelObj;
      },
      reheat
    );

    function reheat() {
      var events = scope.zoomLevelObj.events;
      heatmapLayer.setMap(scope.map);
      heatmapLayer.setData(events);
      // optionally bypass map markers (default: on)
      if (attrs.markers !== 'off') {
        removeMarkers();
        addMarkers(events, scope.map);
      }
    }

    function removeMarkers() {
      for(var i=0; i<gmarkers.length; i++) {
        gmarkers[i].setMap(null);
      }
    }

    function addMarkers(events, map) {
      events.forEach(function addMarker(event) {
        var image = event.eventSource ?
          'images/' + event.eventSource + '.gif' :
          null; // null = default marker icon
        var marker = new google.maps.Marker({
          position: event.location,
          map: map,
          icon: image,
          opacity: 0.3
        });

        gmarkers.push(marker);
        marker.addListener('click', function() {
          var source = event.eventSource;
          if (source === 'sandbox') {
            createNetGraph(event);
          } else if (event.source === 'hashtag') {
            // TODO
          }
        });
      });
    }
  }

  function createNetGraph(event) {
    var query = {
      filter: {
        where: { id: event.eventId }
      }
    };

    SandboxEventsSource.find(query,
      function(eventSources) {
        var source = eventSources[0];
        if (source) {
          render_graph(
            format_graph(source.extra.network_graph),
            {
              onHover: function(node) {
                console.log('node:: ', node.id);
                $('#' + node.id).removeClass('muted');
              }
            }
          );

          ImageManagerService.setImages(source.extra.node_to_url);
        }
      }
    );
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
