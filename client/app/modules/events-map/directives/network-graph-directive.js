'use strict';
angular.module('genie.eventsMap')
.directive('networkGraph', [
  function() {
    return {
      controller: ['$scope', 'ImageManagerService', 'SandboxEventsSource',
        function($scope, ImageManagerService, SandboxEventsSource) {
          this.createNetGraph = createNetGraph;

          function createNetGraph(event, callback) {
            var query = {
              filter: {
                where: { event_id: event.event_id }
              }
            };

            SandboxEventsSource.find(query)
            .$promise
            .then(graphEvents)
            .then(callback || angular.noop)
            .catch(console.error);
          }

          function graphEvents(sources) {
            var source = sources[0];
            if (source) {
              showImages({
                nodes: source.network_graph.nodes,
                urls: source.node_to_url
              });

              render_graph(
                format_graph(source.network_graph),
                {
                  onHover: function(node) {
                    console.log('node:: ', node.id);
                    ImageManagerService.markSelected(node.id);
                    $scope.$apply();
                  }
                }
              );

              ImageManagerService.setImages(source.node_to_url);
            }
          }

          // combine netgraph nodes and urls to add image markers on map
          // args: urls {}, nodes {}
          function showImages(options) {
            if (!(options.urls && options.urls.length)) return;
            var markers = options.urls.map(function(url) {
              var netNode = _.detect(options.nodes,
                function(node) { return node.id == url.nodeId });
              var image = {
                url: url.url,
                size: new google.maps.Size(60, 60)
              };
              return new google.maps.Marker({
                position: { lat: netNode.lat, lng: netNode.lon },
                icon: image
              });
            });

            var i = 0, nextMarker;
            // recursively show marker to present a brief time delay
            function showMarker(marker) {
              marker.setMap($scope.map);
              setTimeout(function() {
                marker.setMap(null);
                marker = null;
              }, 1000);
              nextMarker = markers[i++];
              if (nextMarker && i < 25) { // be polite to ur browser
                setTimeout(function() {
                  showMarker(nextMarker);
                }, 50);
              }
            }

            showMarker(markers[0]);
          }
      }]
    };
}]);
