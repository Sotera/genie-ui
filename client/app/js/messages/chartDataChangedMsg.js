angular.module('loopbackApp')
.service('ChartDataChangedMsg', ['$rootScope', function ($rootScope) {
  this.broadcast = function broadcast() {
    var args = ['ChartDataChangedMsg'];
    Array.prototype.push.apply(args, arguments);
    $rootScope.$broadcast.apply($rootScope, args);
  };
  this.listen = function (callback) {
    $rootScope.$on('ChartDataChangedMsg', callback)
  }
}]);