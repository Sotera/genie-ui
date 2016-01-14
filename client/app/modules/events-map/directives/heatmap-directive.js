'use strict';
angular.module('genie.eventsMap')
.directive('heatMap', ['CoreService', function (CoreService) {

  function link(scope, elem, attrs) {
    var heatmapLayer = new google.maps.visualization.HeatmapLayer(
      {
        radius:24
      });

    scope.$watchCollection(
      function(scope) {
        return scope.zoomLevelObj;
      },
      reheat
    );

    function reheat() {
      var events = scope.zoomLevelObj.events;
      heatmapLayer.setMap(scope.map);
      heatmapLayer.setData(events);
      addMarkers(events, scope.map);
    }

    function addMarkers(events, map) {
      var marker, image;
      events.forEach(function addMarker(event) {
        image = event.eventSource ?
          'images/' + event.eventSource + '.gif' :
          null; // null = default marker icon
        marker = new google.maps.Marker({
          position: event.location,
          map: map,
          icon: null,
          opacity: 0
        });

        marker.addListener('click', function() {
          console.log(event)
          var template = (
            "<p># permits: <%= weight %></p>" +
            "<p>min value: <%= extra.min_val %></p>" +
            "<p>max value: <%= extra.max_val %></p>" +
            "<a target='_blank' href='/util/permit-data/<%= eventId %>'>" +
            "Download permit data" +
            "</a>"
          );
          var compiled = _.template(template);
          CoreService.swal({
            html: true,
            title: event.tag,
            text: compiled(event)
          });
          // console.log(event.eventSource)
          // getTweets(event.eventId, success);
          // function success(results) {
          //   console.log(results.data.hits.hits[0]._source.caption)
          //   //TODO: show all messages to user
          //   CoreService.toastInfo('Tweet',
          //     results.data.hits.hits[0]._source.caption)
          // }
        });
      });
    }
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
