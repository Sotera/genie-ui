'use strict';
angular.module('genie.eventsMap')
.controller('EventsMapCtrl', ['$scope', 'mapService', 'ZoomLevel',
  'tweetService', 'ENV',
  function($scope, mapService, ZoomLevel, tweetService, ENV) {

  var PERIOD = ENV.period; // days
  var DAY = ENV.day; // mins
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
    if ($scope.map.empty) { // manual flag: true when no data has been set (init load)
      $scope.map.setCenter(zoomLevelObj.centerPoint);
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
