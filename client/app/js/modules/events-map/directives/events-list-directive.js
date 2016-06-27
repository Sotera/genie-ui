'use strict';
angular.module('genie.eventsMap')
.directive('eventsList', ['$window', 'mapService', 'ImageManagerService',
  'SandboxEventsSource', 'MarkersService', 'sourceIconFilter',
  'ChartDataChangedMsg', 'ChartDateSelectedMsg', 'StylesService',
  'HashtagEventsSource',
  function($window, mapService, ImageManagerService,
    SandboxEventsSource, MarkersService, sourceIcon,
    ChartDataChangedMsg, ChartDateSelectedMsg,
    StylesService, HashtagEventsSource) {

  return {
    restrict: 'E',
    require: ['networkGraph', 'tagCloud', 'gmapInfowindow'],
    link: link,
    templateUrl: '/modules/events-map/views/events-list',
    controller: ['$scope', function($scope) {

      $scope.isEventSelected = function(event) {
        return $scope.selectedEvent && $scope.selectedEvent.event_id == event.event_id;
      };

      $scope.isClusterSelected = function(cluster) {
        return $scope.selectedCluster && $scope.selectedCluster.id == cluster.id;
      };

      $scope.isSelectedEventInCluster = function(cluster) {
        return $scope.selectedEvent && _.contains(cluster.events, $scope.selectedEvent);
      }
    }]
  };

  function link(scope, elem, attrs, ctrls) {
    resize(elem);

    var boxes = [];
    var netGraphCtrl = ctrls[0],
      tagCloudCtrl = ctrls[1],
      gmapInfowindowCtrl = ctrls[2];

    scope.$watch('features.sources', showAllClusters);
    scope.$watch('inputs.minutes_ago', removeArtifacts);

    // ChartDateSelectedMsg.listen(function (_event,row,date) {
    // });

    // remove items added to map
    function removeArtifacts() {
      ImageManagerService.clear();
      netGraphCtrl.clear();
      tagCloudCtrl.clear();
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
      // none selected or cluster already selected
      var doShow = !scope.selectedCluster || (scope.selectedCluster.id !== cluster.id);
      if (doShow) {
        removeArtifacts();
        scope.selectedEvent = null; // reset
        scope.selectedCluster = cluster;
        showCluster(cluster);
      }
      zoomToCluster(cluster);
    };

    scope.highlightCluster = function(cluster) {
      if (scope.map.getZoom() < 10) { // not when up close
        var marker = new google.maps.Marker({
          map: scope.map,
          position: cluster.location
        });

        MarkersService.delayRemove([marker], {delay: 3000});
      }
    }

    function zoomToCluster(cluster) {
      var map = scope.map;
      var bounds = new google.maps.LatLngBounds;
      map.setCenter(cluster.location);
      map.setZoom(_.max([map.getZoom(), 14]));
      // cluster.events.forEach(function(event) {
      //   var bb = event.bounding_box,
      //     ne = new google.maps.LatLng({lat: bb.ne.lat, lng: bb.ne.lng}),
      //     sw = new google.maps.LatLng({lat: bb.sw.lat, lng: bb.sw.lng});
      //   bounds = bounds.union(new google.maps.LatLngBounds(sw, ne));
      // });
      // map.fitBounds(bounds);
    }

    scope.selectEvent = function(event) {
      ImageManagerService.clear();
      // revert previous highlight
      let prevEvent = scope.selectedEvent;
      scope.selectedEvent = event;
      scope.highlightEventBox(prevEvent, { revert: true });
      showEvent(event);
    };

    function showEvent(event) {
      if (event.event_source == 'hashtag') {
        var params = [_.pick(event, ['event_id', 'event_source'])];
        showTweetMarkers(params);
        tagCloudCtrl.update([event]);
        updateTimeSeriesChart(event);
      } else {
        showSandboxImages(event);
      }
    }

    function updateTimeSeriesChart(event) {
      var query = {
        filter: {
          where: { event_id: event.event_id }
        }
      };

      HashtagEventsSource.find(query)
      .$promise
      .then(updateTimeSeries)
      .catch(console.error);

      function updateTimeSeries(sources) {
        var source = sources[0];
        if (!source) return;
        ChartDataChangedMsg.broadcast(source.timeseries_data, 'hour');
      }
    }

    function showCluster(cluster) {
      if (cluster.events[0].event_source === 'hashtag') {
        tagCloudCtrl.update(cluster.events);
      }
      drawBoxes(cluster.events);
    }

    function showTweetMarkers(params) {
      scope.showSpinner = true;
      MarkersService.clear({ artifact: 'markers', type: 'sources'});
      MarkersService.clear({ artifact: 'infowindows', type: 'sources'});

      return mapService.getClusterSources(params)
      .then(function(sources) {
        scope.sources = _.sortBy(sources, 'author');
        sources.forEach(function(source) {
          var marker = new google.maps.Marker({
            map: scope.map,
            animation: google.maps.Animation.DROP,
            position: { lat: source.lat, lng: source.lng }
          });

          marker.customId = source.id; // find it later

          var infowindow = gmapInfowindowCtrl.createTextInfoWindow(source);
          infowindow.customId = source.id; // find it later

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

    function showSandboxImages(event) {
      scope.showSpinner = true;
      // clear image markers artifacts
      MarkersService.clear({ artifact: 'markers', type: 'sources'});
      MarkersService.clear({ artifact: 'infowindows', type: 'sources'});

      showImageMarkers(event);
      netGraphCtrl.create(event, () => scope.showSpinner = false);
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

        // sandbox stores posts in node_to_url property
        scope.sources = _.sortBy(source.node_to_url, 'author');

        ChartDataChangedMsg.broadcast(source.timeseries_data, 'hour');

        // retain nodes lat-lng. render_graph() mutates its input.
        var sourceNodes = source.network_graph.nodes.map(function(node) {
          return {id: node.id, lat: node.lat, lng: node.lon};
        });
        sourceNodes.forEach(function(node) {
          var marker = new google.maps.Marker({
            position: { lat: node.lat, lng: node.lng },
            map: scope.map,
            animation: google.maps.Animation.DROP
          });
          var post = _.detect(source.node_to_url, p => node.id == p.nodeId);
          var infowindow = gmapInfowindowCtrl.createImageInfoWindow(post);

          marker.customId = node.id; // find it later
          infowindow.customId = node.id; // find it later

          marker.addListener('click', () => {
            infowindow.open(scope.map, marker);
          });

          MarkersService.addItem({
            artifact: 'infowindows',
            type: 'sources',
            obj: infowindow
          });

          MarkersService.addItem({
            artifact: 'markers',
            type: 'sources',
            obj: marker
          });
        });
      }
    }

    function showAllClusters() {
      // exit if user already selected a cluster
      if (scope.selectedCluster) return;
      removeArtifacts();
      if (scope.features.sources) {
        angular.forEach(scope.clusters, showCluster);
      }
    }

    scope.highlightEventBox = (event, options={}) => {
      if (!event) return;
      let box = _.detect(boxes, b => b.customId === event.event_id);
      if (!box) return;
      if (options.revert) {
        if (scope.selectedEvent !== event)
          box.setOptions(StylesService.boxMuted);
      } else {
        box.setOptions(StylesService.boxHighlight);
      }
    };

    function drawBoxes(events) {
      if (!(events && events.length)) return;
      events.forEach(drawBox);
    }

    function drawBox(event) {
      var bb = event.bounding_box;
      if (bb.sw.lat === bb.ne.lat) { // if a single point, make just large enough to see
        bb.ne.lat = bb.sw.lat + 0.003;
        bb.ne.lng = bb.sw.lng + 0.003;
      }
      var box = new google.maps.Rectangle({
        map: scope.map,
        bounds: { // with some extra padding
          north: bb.ne.lat + 0.002,
          east: bb.ne.lng + 0.002,
          south: bb.sw.lat - 0.002,
          west: bb.sw.lng - 0.002
        }
      });
      box.setOptions(StylesService.boxMuted);
      box.customId = event.event_id; // find by eventid later
      boxes.push(box);
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

}]);
