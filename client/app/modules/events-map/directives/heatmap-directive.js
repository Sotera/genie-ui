'use strict';
angular.module('genie.eventsMap')
.directive('heatMap', ['CoreService', 'ENV', function (CoreService, ENV) {

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
          icon: image,
          opacity: 0.3
        });

        marker.addListener('click', function() {
          console.log(event)

          createNetGraph(event);
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

  function createNetGraph(event) {
    var query = {
      query: { match: { id: event.eventId } }
    };

    $.ajax({
      url: ENV.sandboxEventsUrl,
      type: 'POST',
      crossDomain: true,
      dataType: 'json',
      data: JSON.stringify(query)
    })
    .done(
      function(res) {
        // console.log(res.hits.hits[0]._source.extra.network_graph)
        render_graph(
          format_graph(res.hits.hits[0]._source.extra.network_graph),
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
    );
  }

  return {
    restrict: 'AE',
    link: link
  };
}]);
