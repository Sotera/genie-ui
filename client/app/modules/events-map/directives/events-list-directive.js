'use strict';
angular.module('genie.eventsMap')
.directive('eventsList', ['$timeout', 'sourceIconFilter', '$window', 'mapService',
  function($timeout, sourceIconFilter, $window, mapService) {

  function link(scope, elem, attrs, netGraphCtrl) {
    resize(elem);

    var boxes = [], markers = [], infowindows = [];

    scope.$watch('features.boxes', showBoxes);

    // scope.showEvent = function(event) {
    //   scope.selectedEvent = event;
    //   showMarker(event, {autoHide: true});
    //   scope.showSpinner = true;
    //   var source = event.event_source;
    //   if (source === 'sandbox') {
    //     netGraphCtrl.createNetGraph(event,
    //       function() {scope.showSpinner = false;});
    //   } else if (event.eventSource === 'hashtag') {
    //     console.info('TODO');
    //     scope.showSpinner = false;
    //   } else { // no eventSource
    //     scope.showSpinner = false;
    //   }
    // };

    function reset() {
      clearMarkers();
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

    scope.highlightCluster = function(cluster) {
      reset();
      scope.showSpinner = true;
      scope.selectedCluster = cluster;
      showMarker(cluster, {autoHide: true});
      drawBox(cluster);

      var params = cluster.events.map(function(event) {
        return _.pick(event, ['event_id', 'event_source']);
      });

      mapService.getClusterSources(params)
      .then(function(sources) {
        // var marker, infowindow;
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
        maxWidth: 200,
        content: _.template(" \
          <blockquote><%= text %></blockquote> \
          <ul> \
            <li><a href='<%= url %>' target='_blank'> \
              <%= screen_name %> \
            </a></li> \
          </ul> \
          ")({
            text: tweet.text,
            screen_name: tweet.screen_name,
            url: tweet.url
          })
      });
    }

    scope.showAllMarkers = function() {
      angular.forEach(scope.events, function(evt) {
        showMarker(evt, {autoHide: true});
      });
    };

    scope.showBoxes = showBoxes;

    function showBoxes() {
      if (scope.features.boxes) {
        angular.forEach(scope.clusters, drawBox);
      } else {
        resetBoxes();
      }
    };
    // function showBoxes() {
    //   if (scope.features.boxes) {
    //     angular.forEach(scope.events, drawBox);
    //   } else {
    //     resetBoxes();
    //   }
    // };

    function resetBoxes() {
      for(var i=0; i<boxes.length; i++) {
        boxes[i].setMap(null);
        boxes[i] = null;
      }
      boxes = [];
    }

    function drawBox(cluster) {
      // var bb = event.bounding_box;
      var bb = {
        ne: {lat: cluster.location.lat(), lng: cluster.location.lng()},
        sw: {}
      };
      if (!bb || _.isEmpty(bb)) return;
      // if (bb.sw.lat === bb.ne.lat) { // if a single point, make just large enough to see
        bb.sw.lat = bb.ne.lat - 0.1;
        bb.sw.lng = bb.ne.lng - 0.1;
      // }
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
      box.addListener('click', function() {
        scope.highlightCluster(cluster);
      });
      boxes.push(box);
    }

    // function drawBox(event) {
    //   var bb = event.bounding_box;
    //   if (!bb || _.isEmpty(bb)) return;
    //   if (bb.sw.lat === bb.ne.lat) { // if a single point, make just large enough to see
    //     bb.sw.lat = bb.ne.lat - 0.0003;
    //     bb.sw.lng = bb.ne.lng - 0.0003;
    //   }
    //   var box = new google.maps.Rectangle({
    //     strokeColor: '#FF0000',
    //     strokeOpacity: 0.8,
    //     strokeWeight: 2,
    //     fillColor: '#FF0000',
    //     fillOpacity: 0.35,
    //     map: scope.map,
    //     bounds: {
    //       north: bb.ne.lat,
    //       east: bb.ne.lng,
    //       south: bb.sw.lat,
    //       west: bb.sw.lng
    //     }
    //   });
    //   box.addListener('click', function() {
    //     scope.showEvent(event);
    //   });
    //   boxes.push(box);
    // }

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

    // function showMarker(event, options) {
    //   var iconPath = sourceIconFilter(event.event_source);
    //   var marker = new google.maps.Marker({
    //     map: scope.map,
    //     icon: iconPath,
    //     animation: google.maps.Animation.DROP,
    //     position: {lat: event.lat, lng: event.lng}
    //   });

    //   marker.addListener('click', function() {
    //     scope.showEvent(event);
    //   });

    //   if (options.autoHide) {
    //     $timeout(function() {
    //       marker.setMap(null);
    //       marker = null;
    //     }, 2000);
    //   }
    // }

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
      // $scope.isSelected = function(event) {
      //   if ($scope.selectedEvent && $scope.selectedEvent.event_id == event.event_id)
      //     return 'selected';
      // }
      $scope.isSelected = function(cluster) {
        if ($scope.selectedCluster && $scope.selectedCluster.id == cluster.id)
          return 'selected';
      }
    }]
  };
}]);
