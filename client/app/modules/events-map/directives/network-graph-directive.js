'use strict';
angular.module('genie.eventsMap')
.directive('networkGraph', ['ImageManagerService', 'SandboxEventsSource',
  function(ImageManagerService, SandboxEventsSource) {

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
      scope: {},
      controller: [function() {
        this.createNetGraph = createNetGraph;
      }],
    };
}]);
