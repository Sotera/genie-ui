'use strict';
angular.module('genie.eventsMap')
.controller('EventsMapCtrl', ['$scope', 'mapService', 'ZoomLevel',
  'tweetService', 'CoreService',
  function($scope, mapService, ZoomLevel, tweetService, CoreService) {

  var PERIOD = CoreService.env.period; // days
  var DAY = CoreService.env.day; // mins
  // Set init values
  $scope.inputs = {zoomLevel: 18, minutesAgo: DAY * PERIOD};
  $scope.map = {};
  var zoomLevelObj = new ZoomLevel();
  zoomLevelObj.events = [];
  $scope.zoomLevelObj = zoomLevelObj;

  // Watch user inputs and fetch zoomlevel object
  $scope.$watchCollection(
    function(scope) {
      return scope.inputs;
    },
    getZoomLevel
  );

  // Watch live hashtags
  $scope.liveTags = tweetService.getHashtags();

  function getZoomLevel() {
    mapService.getZoomLevel($scope.inputs)
    .then(function(zoomLevel) {
      updateMap(zoomLevel);
      updateTagCloud(zoomLevel);
    });
  }

  //jqcloud tag collection
  var tagHandlers = {
    click: function(e) {
      var removeTag = e.target.textContent;
      $scope.$apply(function(scope) {
        _.remove(scope.tags, function(tag) {
          return tag.text == removeTag;
        });
        scope.zoomLevelObj.force = Date.now(); // hack: force change, for watchers
        _.remove(scope.zoomLevelObj.events, function(event) {
          return event.tag == removeTag;
        });
      });
    }
  };

  function updateMap(zoomLevelObj) {
    if (!zoomLevelObj.events.length) {
      CoreService.toastInfo('No Events Found', 'hint: change the date to search for events');
    }
    // manual flag: true when no data has been set (init load)
    if ($scope.map.empty) {
      var center = zoomLevelObj.centerPoint || {lat: 30.25, lng: -97.75}; // Austin, if no events
      $scope.map.setCenter(center);
      $scope.map.empty = false;
    }
    $scope.zoomLevelObj = zoomLevelObj;
  }

  function updateTagCloud(zoomLevelObj) {
    //jqcloud tag collection
    var tags = _.map(zoomLevelObj.events, function(event) {
      return {
        text: event.tag,
        weight: event.weight,
        handlers: tagHandlers
      };
    });
    // TODO: remove .uniq() once the server has TagCloud api
    $scope.tags = _.uniq(tags, 'text');
  }
}]);
