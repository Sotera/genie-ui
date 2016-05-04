'use strict';
angular.module('genie.eventsMap')
.directive('tagCloud', ['sourceIconFilter', '$timeout',
  function(sourceIcon, $timeout) {
    return {
      controller: ['$scope', 'HashtagEventsSource', function($scope, HashtagEventsSource) {
        this.update = update;
        this.clear = clear;

        var tagHandlers = {
          click: function(e) {
            var clickedTag = e.target.textContent;
            $scope.events.forEach(function(event) {
              if (event.event_source === 'hashtag') {
                animateMarker(event);
              }
            });
          }
        };

        function animateMarker(event) {
          var iconPath = sourceIcon(event.event_source);
          var marker = new google.maps.Marker({
            map: $scope.map,
            animation: google.maps.Animation.DROP,
            icon: iconPath,
            position: {lat: event.lat, lng: event.lng}
          });

          $timeout(function() {
            marker.setMap(null);
            marker = null;
          }, 1000);
        }

        function clear() {
          // wait for running digests to finish
          $timeout(function() {
            $scope.$apply(function() {
              $scope.tags = [];
            });
          }, 0);
        }

        function update(events) {
          if (!(events && events.length)) return;

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
                weight: source.unique_user_count
              };
            });

            Genie.worker.run({
              worker: 'tagCloud',
              method: 'prepare',
              args: { tags: tags }
            },
            function(e) {
              var tags = e.data.tags;
              // handlers don't serialize web worker messaging so add them here
              tags.forEach(function(tag) { tag.handlers = tagHandlers; });
              $scope.$apply(function() {
                $scope.tags = tags;
              });
            });
          },
          console.error);
        }
      }
    ]};



}]);
