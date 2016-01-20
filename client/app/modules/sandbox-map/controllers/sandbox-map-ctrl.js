'use strict';
angular.module('genie.sandboxMap')
.controller('SandboxMapCtrl', ['$scope', '$stateParams', '$state',
  'MockDataService',
  function ($scope, $stateParams, $state, MockDataService) {

    $scope.showEvents = function() {
      $scope.events = MockDataService.events;

      render_graph(
        format_graph(MockDataService.network),
        {
          "onHover" : function(node) {
            console.log('node:: ', node.id);

            // socket.emit('url_from_id', node.id, function(d) {
            //     m = draw_image(d);
            // });
          }
        }
        );
    }


}]);
