'use strict';
angular.module('genie.sandboxMap')
.controller('MapCtrl', ['$scope', '$stateParams', '$state',
  'MockDataService',
  function ($scope, $stateParams, $state, MockDataService) {

    $scope.showEvents = function() {
      var res = {"events":[{"id":1215,"count":22,"location":{"lat":{"min":30.2663708,"max":30.2663708},"lon":{"min":-97.7418289,"max":-97.7418289}},"created_time":{"min":1452122538,"max":1452123354},"created_time_norm":{"min":0.9278832610287904,"max":0.9508704715758635}},{"id":1045,"count":183,"location":{"lat":{"min":30.2672,"max":30.2672},"lon":{"min":-97.7639,"max":-97.7639}},"created_time":{"min":1452089670,"max":1452119963},"created_time_norm":{"min":0.0019719420812440137,"max":0.8553439630401712}}]}

      $scope.events = res.events;

      var data = MockDataService.data

      var state = {
        xvar      : 'lon',
        yvar      : 'lat',
        threshold : .4,
      }

      var grapher = undefined;
      $('#graph').css('display', 'inline')
      var div = $('#graph');

      var width  = div.width(),
          height = div.height(),
          i, force;

      var network = MockDataService.network;
      network.set_filter = function(threshold) {
        if(threshold) { this.threshold = threshold; }

        var links_sub = _.filter(this.links, function(link) {
            return link.sim > threshold
        });


        this.filtered = {
            "nodes" : network.nodes,
            "links" : links_sub
        };
      }
      // var network = init_network(data, {"width" : width, "height" : height, "callbacks" : callbacks});
  //        network.fix_dims(state.xvar, state.yvar);
      network.set_filter(state.threshold);

      // Create a grapher instance (width, height, options)
      grapher = new Grapher({
          canvas : document.getElementById('graph'),
          width  : width,
          height : height,
      });
      grapher.data(network.filtered);

      function make_force() {
        return d3.layout.force()
            .nodes(network.filtered.nodes)
            .links(network.filtered.links)
            .size([width, height])
            .on('tick', function() {grapher.update()})
            .linkStrength(0.5)
            .linkDistance(5)
            .charge(-10)
            // .friction(.5)
            .alpha(1)
            .start()
      }

      // force = make_force();

      grapher.play();
    }


}]);
