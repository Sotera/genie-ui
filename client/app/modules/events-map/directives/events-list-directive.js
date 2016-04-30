'use strict';
angular.module('genie.eventsMap')
.directive('eventsList', ['$window', 'mapService',
  'ImageManagerService', 'SandboxEventsSource', 'MarkersService',
  function($window, mapService, ImageManagerService,
    SandboxEventsSource, MarkersService) {

  function link(scope, elem, attrs, netGraphCtrl) {
    resize(elem);

    var boxes = [];

    scope.$watch('features.sources', showAllSources);
    scope.$watch('inputs.minutes_ago', removeArtifacts);

    function removeArtifacts() {
      netGraphCtrl.removeNetGraph();
      clearBoxes();
      MarkersService.clearAll();
    }

    function clearBoxes() {
      for(var i=0; i<boxes.length; i++) {
        boxes[i].setMap(null);
        boxes[i] = null;
      }
      boxes = [];
    }

    scope.selectCluster = function(cluster) {
      removeArtifacts();
      ImageManagerService.clear();
      scope.selectedCluster = cluster;
      showSources(cluster);
    }

    function showSources(cluster) {
      if (cluster.events[0].event_source == 'hashtag') {
        showHashtagSources(cluster);
      } else {
        showSandboxSources(cluster);
      }
    }

    function showHashtagSources(cluster) {
      scope.showSpinner = true;

      var params = cluster.events.map(function(event) {
        return _.pick(event, ['event_id', 'event_source']);
      });

      return mapService.getClusterSources(params)
      .then(function(sources) {
        drawBox(sources);
        sources.forEach(function(src) {
          var marker = new google.maps.Marker({
            map: scope.map,
            icon: 'images/hashtag.gif',
            animation: google.maps.Animation.DROP,
            position: { lat: src.lat, lng: src.lng }
          });

          var infowindow = createTweetInfoWindow(src);
          marker.addListener('click', function() {
            infowindow.open(scope.map, marker);
          });
          MarkersService.addItem({
            artifact: 'markers',
            type: 'sources',
            obj: marker
          });
          MarkersService.addItem({
            artifact: 'infowindows',
            type: 'sources',
            obj: infowindow
          });
        });
        scope.showSpinner = false;
      });
    }

    function showSandboxSources(cluster) {
      drawBox(cluster.events);
      cluster.events.forEach(function(event) {
        var marker = new google.maps.Marker({
          map: scope.map,
          icon: 'images/sandbox.gif',
          animation: google.maps.Animation.DROP,
          position: { lat: event.lat, lng: event.lng }
        });

        marker.addListener('click', function() {
          // clear image markers artifacts
          MarkersService.clear({ artifact: 'markers', type: 'sources'});
          MarkersService.clear({ artifact: 'infowindows', type: 'sources'});
          if (marker.__expanded) { // has been clicked to show stuff?
            marker.__expanded = false;
            return;
          }
          marker.__expanded = true;
          scope.showSpinner = true;
          showImageMarkers(event);
          netGraphCtrl.createNetGraph(
            event,
            function() {scope.showSpinner = false;}
          );
        });
        MarkersService.addItem({
          artifact: 'markers',
          type: 'events',
          obj: marker
        });
      });
    }

    function showImageMarkers(event) {
      var query = {
        filter: {
          where: { event_id: event.event_id }
        }
      };

      SandboxEventsSource.find(query)
      .$promise
      .then(addMarkers)
      .catch(console.error);

      function addMarkers(sources) {
        var source = sources[0];
        if (!source) return;

        // retain nodes lat-lng. render_graph mutates its input.
        var sourceNodes = source.network_graph.nodes.map(function(node) {
          return {id: node.id, lat: node.lat, lng: node.lon};
        });
        sourceNodes.forEach(function(node) {
          var marker = new google.maps.Marker({
            position: { lat: node.lat, lng: node.lng },
            map: scope.map
          });
          marker.addListener('click', function() {
            //clear other infowindows
            MarkersService.clear({ artifact: 'infowindows', type: 'sources'});
            var url = _.detect(source.node_to_url,
              function(url) { return node.id == url.nodeId });

            var infowindow = new google.maps.InfoWindow({
              maxWidth: 160,
              content: "<img width='160px' src='" + url.url + "'>"
            });
            infowindow.open(scope.map, marker);
            MarkersService.addItem({
              artifact: 'infowindows',
              type: 'sources',
              obj: infowindow
            });
          });
          MarkersService.addItem({
            artifact: 'markers',
            type: 'sources',
            obj: marker
          });
        });
      }
    }

    function createTweetInfoWindow(tweet) {
      return new google.maps.InfoWindow({
        maxWidth: 240,
        content: _.template(" \
          <table> \
            <tr> \
              <td> \
                <img width='60px' src='<%= image_url %>' /> \
              </td> \
              <td> \
                <a style='color:black' href='<%= url %>' target='_blank'> \
                  <%= text %> \
                </a> \
              </td> \
            </tr> \
            <tr> \
              <td style='color:black' colspan='2'> \
                <a href='<%= url %>' target='_blank'> \
                  By: @<%= author %> \
                </a> \
              </td> \
            </tr> \
            <tr> \
              <td style='color:black' colspan='2'> \
                Posted: <%= moment(post_date).format('MM-DD hh:mm a') %> \
              </td> \
            </tr> \
          </table> \
          ")({
            text: tweet.text,
            author: tweet.author,
            url: tweet.url,
            image_url: tweet.image_url,
            post_date: new Date(tweet.post_date).toGMTString()
          })
      });
    }

    function showAllSources() {
      removeArtifacts();
      if (scope.features.sources) {
        angular.forEach(scope.clusters, showSources);
      }
    };

    function drawBox(sources) {
      if (!(sources && sources.length)) return;
      Genie.worker.run({
        worker: 'mapUtil',
        method: 'getBoundingBox',
        args: { locations: sources }
      },
      function(e) {
        var bb = e.data.bb;
        if (bb.sw.lat === bb.ne.lat) { // if a single point, make just large enough to see
          bb.ne.lat = bb.sw.lat + 0.003;
          bb.ne.lng = bb.sw.lng + 0.003;
        }
        var box = new google.maps.Rectangle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          map: scope.map,
          bounds: { // with some extra padding
            north: bb.ne.lat + 0.002,
            east: bb.ne.lng + 0.002,
            south: bb.sw.lat - 0.002,
            west: bb.sw.lng - 0.002
          }
        });
        // box.addListener('click', function() {
        //   scope.highlightCluster(cluster);
        // });
        boxes.push(box);
      });
    }

    function resize(elem) {
      var $win = $($window);
      var $list = $(elem.children()[0]);
      var doResize = function() {
        var winHeight = $win.height();
        $list.height(winHeight * 0.7);
      };

      $win.bind('resize', _.throttle(doResize, 33.33)).resize();
    }
  }

  return {
    restrict: 'E',
    require: 'networkGraph',
    link: link,
    templateUrl: '/modules/events-map/views/events-list',
    controller: ['$scope', function($scope) {
      $scope.isSelected = function(cluster) {
        if ($scope.selectedCluster && $scope.selectedCluster.id == cluster.id)
          return 'selected';
      }
    }]
  };
}]);
