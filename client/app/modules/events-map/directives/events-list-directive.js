'use strict';
angular.module('genie.eventsMap')
.directive('eventsList', ['$timeout', 'sourceIconFilter', '$window', 'mapService',
  function($timeout, sourceIconFilter, $window, mapService) {

  function link(scope, elem, attrs, netGraphCtrl) {
    resize(elem);

    var boxes = [], markers = [], infowindows = [];

    scope.$watch('features.sources', showAllSources);

    function reset() {
      clearMarkers();
      clearBoxes();
      clearInfoWindows();
    }

    function clearMarkers() {
      for(var i=0; i<markers.length; i++) {
        markers[i].setMap(null);
        markers[i] = null;
      }
      markers = [];
    }

    function clearBoxes() {
      for(var i=0; i<boxes.length; i++) {
        boxes[i].setMap(null);
        boxes[i] = null;
      }
      boxes = [];
    }

    function clearInfoWindows() {
      for(var i=0; i<infowindows.length; i++) {
        infowindows[i].setMap(null);
        infowindows[i] = null;
      }
      infowindows = [];
    }

    scope.selectCluster = function(cluster) {
      reset();
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
            position: {lat: src.lat, lng: src.lng}
          });

          var infowindow = createInfoWindow(src);
          marker.addListener('click', function() {
            infowindow.open(scope.map, marker);
          });
          markers.push(marker);
          infowindows.push(infowindow);
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
          position: {lat: event.lat, lng: event.lng}
        });

        // var infowindow = createInfoWindow(event);
        marker.addListener('click', function() {
          scope.showSpinner = true;
          netGraphCtrl.createNetGraph(event,
            function() {scope.showSpinner = false;});
        });
        markers.push(marker);
        // infowindows.push(infowindow);
      });
    }

    function createInfoWindow(tweet) {
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
      reset();
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
          bounds: {
            north: bb.ne.lat,
            east: bb.ne.lng,
            south: bb.sw.lat,
            west: bb.sw.lng
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
