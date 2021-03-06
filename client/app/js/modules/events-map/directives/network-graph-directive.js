'use strict';
angular.module('genie.eventsMap')
.directive('networkGraph', [
  function() {
    return {
      controller: ['$scope', 'ImageManagerService', 'SandboxEventsSource',
        function($scope, ImageManagerService, SandboxEventsSource) {
          this.create = create;
          this.clear = clear;

          function create(event, callback) {
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

          function clear() {
            // HACK
            var canvas = $('#graph');
            canvas.replaceWith('<canvas id="graph" class="netgraph">');
            // TODO: clearRect() doesn't seem to work?
            // var ctx = canvas.getContext('2d');
            // ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          function graphEvents(sources) {
            var source = sources[0];

            if (source) {
              // retain nodes lat-lng. render_graph mutates its input.
              var sourceNodes = source.network_graph.nodes.map(function(node) {
                return {id: node.id, lat: node.lat, lng: node.lon};
              });
              render_graph(
                format_graph(source.network_graph),
                {
                  onHover: function(node) {
                    console.log('node:: ', node.id);
                    // ImageManagerService.markSelected(node.id);
                    // $scope.$apply();
                    showImageOnMap(node.id, sourceNodes, source.node_to_url);
                  }
                }
              );

              ImageManagerService.setImages(source.node_to_url);
            }
          }

          // TODO: simplify once the server returns combined graph nodes and posts
          //
          function showImageOnMap(nodeId, nodes, posts) {
            var post = _.detect(posts,
              function(post) { return nodeId == post.nodeId });
            var node = _.detect(nodes,
              function(node) { return nodeId == node.id });
            var image = {
              url: post.image_url,
              scaledSize: new google.maps.Size(80, 80)
            };
            var marker = new google.maps.Marker({
              position: { lat: node.lat, lng: node.lng },
              icon: image,
              map: $scope.map,
              zIndex: Date.now() // last on top
            });

            setTimeout(function() {
              marker.setMap(null);
              marker = null;
            }, 3000);
          }
      }]
    };
}]);
