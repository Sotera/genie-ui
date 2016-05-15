'use strict';
angular.module('genie.eventsMap')
.factory('MarkersService', ['$timeout', function($timeout) {

  var artifacts = {
    markers: { sources: [], events: [] },
    infowindows: { sources: [], events: [] }
  };

  // options: artifact, type, obj
  function addItem(options) {
    var artifactType = artifacts[options.artifact];
    if (!(artifactType && artifactType[options.type]))
      throw new TypeError('invalid options passed');

    artifactType[options.type].push(options.obj)
  }

  // options: artifact, type, customId
  function getItem(options) {
    return _.detect(
      artifacts[options.artifact][options.type],
      function(item) { return item.customId == options.customId; }
    );
  }

  function clearAll() {
    Object.keys(artifacts).forEach(function(k) {
      _clearArtifactType(k);
    });
  }

  // options: artifact, type
  function clear(options) {
    var artifactType = artifacts[options.artifact];
    if (!(artifactType && artifactType[options.type]))
      throw new TypeError('invalid options passed');

    _clearArtifactType(options.artifact, options.type);
  }

  // remove collection of markers or infowindows
  // options: delay: in millis
  function delayRemove(items, options) {
    options = options || {};
    $timeout(function() {
      _deref(items);
    }, options.delay || 2000);
  }

  function _clearArtifactType(artifactType, type) {
    if (type) { // just the specified type
      _deref(artifacts[artifactType][type]);
      _empty(artifactType, type);
    } else {
      _.each(artifacts[artifactType], _deref);
      Object.keys(artifacts).forEach(function(k) {
        _empty(k);
      });
    }
  }

  function _empty(artifactType, type) {
    if (type) {
      artifacts[artifactType][type] = [];
    } else {
      Object.keys(artifacts[artifactType]).forEach(function(k) {
        _empty(artifactType, k);
      });
    }
  }

  function _deref(arr) { // fully de-reference map variables
    for(var i=0; i<arr.length; i++) {
      arr[i].setMap(null);
      arr[i] = null;
    }
  }

  return {
    clear: clear,
    clearAll: clearAll,
    addItem: addItem,
    getItem: getItem,
    delayRemove: delayRemove
  };

}]);
