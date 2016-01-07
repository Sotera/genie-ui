'use strict';
angular.module('genie.scraper')
.controller('ScraperCtrl', ['$scope', '$stateParams', '$state',
  'InstagramSource',
  function ($scope, $stateParams, $state, InstagramSource) {

    // Set init values
    $scope.inputs = {zoomLevel: 18, minutesAgo: 1440};
    $scope.map = {};
    $scope.instagramThumbs = [];

    $scope.timeChanged = function(selectedTime) {
      InstagramSource.find()
      .$promise
      .then(
        function(posts) {
          // console.log(posts)
          $scope.instagramThumbs = (
            _.map(posts, function(post) {
              return post.images.thumbnail;
            })
          );
          // console.log($scope.instagramThumbs)
        }
      );

    };
}]);
