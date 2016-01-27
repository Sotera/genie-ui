'use strict';
angular.module('genie.eventsMap')
.directive('tagCloud', ['HashtagEventsSource',
  function(HashtagEventsSource) {

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
        var removeTag = e.target.textContent;
        $scope.$apply(function(scope) {
          _.remove(scope.tags, function(tag) {
            return tag.text == removeTag;
          });
          scope.zoomLevelObj.force = Date.now(); // hack: force change, for watchers
          _.remove(scope.zoomLevelObj.clusters, function(cluster) {
            return cluster.tag == removeTag;
          });
        });
      }
    };

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
            weight: source.num_users,
            // handlers: tagHandlers
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
