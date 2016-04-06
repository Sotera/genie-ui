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
    }

    function clearMarkers() {
      for(var i=0; i<markers.length; i++) {
        markers[i].setMap(null);
        markers[i] = null;
        infowindows[i].setMap(null);
        infowindows[i] = null;
      }
      markers = [];
      infowindows = [];
    }

    function clearBoxes() {
      for(var i=0; i<boxes.length; i++) {
        boxes[i].setMap(null);
        boxes[i] = null;
      }
      boxes = [];
    }

    scope.selectCluster = function(cluster) {
      reset();
      scope.selectedCluster = cluster;
      showSources(cluster)
    }

    function showSources(cluster) {
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
    };

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
              <td> \
                <a href='<%= url %>' target='_blank'> \
                  @<%= author %> \
                </a> \
              </td> \
              <td> \
              </td> \
            </tr> \
          </table> \
          ")({
            text: tweet.text,
            author: tweet.author,
            url: tweet.url,
            image_url: tweet.image_url
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
      Genie.worker.run({
        worker: 'mapUtil',
        method: 'getBoundingBox',
        args: { locations: sources }
      },
      function(e) {
        var bb = e.data.bb;
        if (bb.sw.lat === bb.ne.lat) { // if a single point, make just large enough to see
          bb.sw.lat = bb.ne.lat - 0.02;
          bb.sw.lng = bb.ne.lng - 0.02;
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

    function showMarker(cluster, options) {
      // var iconPath = sourceIconFilter(event.event_source);
      var marker = new google.maps.Marker({
        map: scope.map,
        animation: google.maps.Animation.DROP,
        position: cluster.location
      });

      marker.addListener('click', function() {
        scope.highlightCluster(cluster);
      });

      if (options.autoHide) {
        $timeout(function() {
          marker.setMap(null);
          marker = null;
        }, 2000);
      }
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
