'use strict';
angular.module('genie.eventsMap')
.factory('ImageManagerService', [function() {

  var images = [];

  function markSelected(nodeId) {
    var selected = _.detect(images, function(image) {
      return image.nodeId == nodeId;
    });
    selected.selected = true;
    selected.sort = Date.now();
  }

  // get images by selected, unselected, or all (null)
  function getImages(type) {
    switch(type) {
      case 'selected':
        // sort selected items
        return _(images).filter('selected').sortByOrder('sort', 'desc').value();
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
    images = nodes.map(function(node) {
      node.sort = Date.now(); // add sorting attr to all nodes
      return node;
    });
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
