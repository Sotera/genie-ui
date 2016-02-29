'use strict';
angular.module('genie.socialSandbox')
.controller('SocialSandboxCtrl', ['$scope', 'CoreService', '$sce',
  function ($scope, CoreService, $sce) {
    $scope.sourceUrl = $sce.trustAsResourceUrl(CoreService.env.socialSandboxUrl);
}]);
