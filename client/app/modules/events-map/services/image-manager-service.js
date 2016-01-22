'use strict';
angular.module('genie.eventsMap')
.factory('ImageManagerService', [
  function() {

  var images = [];

  function getImages() {
    return images;
  }

  // nodes from network graph
  function setImages(nodes) {
    images = nodes; // for now, uses unaltered nodes
  }

  function clear() {
    images = [];
  }

  return {
    getImages: getImages,
    setImages: setImages,
    clear: clear
  };

}]);
