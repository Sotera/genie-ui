'use strict';
angular.module('genie.eventsMap')
.directive('tagCloud', ['HashtagEventsSource', 'sourceIconFilter',
  '$timeout',
  function(HashtagEventsSource, sourceIconFilter, $timeout) {

  function link(scope, elem, attrs) {
    scope.$watchCollection(
      function(scope) {
        return scope.events;
      },
      function() {
        updateTagCloud(scope.events);
      }
    );

    var tagHandlers = {
      click: function(e) {
        var clickedTag = e.target.textContent;
        scope.events.forEach(function(event) {
          if (event.event_source === 'hashtag') {
            animateMarker(event);
          }
        });
        // scope.$apply(function(scope) {
          // _.remove(scope.tags, function(tag) {
          //   return tag.text == clickedTag;
          // });
          // scope.zoomLevelObj.force = Date.now(); // hack: force change, for watchers
          // _.remove(scope.zoomLevelObj.clusters, function(cluster) {
          //   return cluster.tag == clickedTag;
          // });
        // });
      }
    };

    function animateMarker(event) {
      var iconPath = sourceIconFilter(event.event_source);
      var marker = new google.maps.Marker({
        map: scope.map,
        animation: google.maps.Animation.DROP,
        icon: iconPath,
        position: {lat: event.lat, lng: event.lng}
      });

      $timeout(function() {
        marker.setMap(null);
        marker = null;
      }, 1000);
    }

    function updateTagCloud(events) {
      if (!(events && events.length)) return;

      //jqcloud tag collection
      var eventIds = _.map(events, 'event_id');

      HashtagEventsSource.find({
        filter: {
          where: {
            event_id: { inq: eventIds }
          }
        }
      })
      .$promise
      .then(function(sources) {
        var tags = _.map(sources, function(source) {
          return {
            text: source.hashtag,
            weight: source.num_unique_users,
            handlers: tagHandlers
          };
        });

        // TODO: remove .uniq() once the server has TagCloud api
        scope.tags = _.uniq(tags, 'text');
      },
      function(err) { console.error(err); });
    }
  }

  return {
    link: link
  };
}]);
