'use strict';
angular.module('genie.eventsMap')
.factory('ImageManagerService', [function() {

  var images = [];

  function markSelected(nodeId) {
    var selected = _.detect(images, function(image) {
      return image.nodeId == nodeId;
    });
    selected.selected = true;
  }

  // get images by selected, unselected, or all (null)
  function getImages(type) {
    switch(type) {
      case 'selected':
        return _.filter(images, 'selected');
        break;
      case 'unselected':
        return _.reject(images, 'selected');
        break;
      default:
        return images;
    }
  }

  // nodes from network graph
  function setImages(nodes) {
    images = nodes; // for now, uses unaltered nodes
  }

  function clear(type) {
    // for selected, change marker. anything else, clear the storage.
    if (type === 'selected') {
      images.forEach(function(image) {
        if (image.selected)
          image.selected = false;
      });
    } else {
      images = [];
    }
  }

  return {
    getImages: getImages,
    setImages: setImages,
    clear: clear,
    markSelected: markSelected
  };

}]);
