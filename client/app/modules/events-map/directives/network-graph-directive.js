'use strict';
angular.module('genie.eventsMap')
.directive('networkGraph', [
  function() {
    return {
      controller: ['$scope', 'ImageManagerService', 'SandboxEventsSource',
        function($scope, ImageManagerService, SandboxEventsSource) {
          this.createNetGraph = createNetGraph;

          function createNetGraph(event) {
            var query = {
              filter: {
                where: { event_id: event.event_id }
              }
            };

            SandboxEventsSource.find(query)
            .$promise
            .then(graphEvents)
            .catch(console.error);
          }

          function graphEvents(sources) {
            var source = sources[0];
            if (source) {
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
            $scope.showSpinner = false;
          }
      }]
    };
}]);
