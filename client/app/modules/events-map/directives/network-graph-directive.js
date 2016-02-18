'use strict';
angular.module('genie.eventsMap')
.directive('networkGraph', ['ImageManagerService', 'SandboxEventsSource',
  function(ImageManagerService, SandboxEventsSource) {

    function createNetGraph(event, onHover) {
      var query = {
        filter: {
          where: { event_id: event.event_id }
        }
      };

      SandboxEventsSource.find(query, graphEvents(onHover));
    }

    function graphEvents(onHover) {
      return function(sources) {
        var source = sources[0];
        if (source) {
          render_graph(
            format_graph(source.network_graph),
            {
              onHover: onHover
            }
          );

          ImageManagerService.setImages(source.node_to_url);
        }
      };
    }

    // var $imageBucket = $('#image-bucket');

    // function highlightImage(imageId) {
    //   $imageBucket.removeClass('hide');
    //   var $image = $('#' + imageId);
    //   if (!$image.hasClass('highlighted')) {
    //     $imageBucket.append($image);
    //     $image.removeClass('muted');
    //     $image.addClass('highlighted');
    //   }
    // }

    return {
      scope: {},
      controller: [function() {
        this.createNetGraph = createNetGraph;
      }]
    };
}]);
