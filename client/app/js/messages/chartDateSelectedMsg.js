angular.module('loopbackApp')
  .service('ChartDateSelectedMsg', ['$rootScope', function ($rootScope) {
    this.broadcast = function broadcast() {
      var args = ['ChartDateSelectedMsg'];
      Array.prototype.push.apply(args, arguments);
      $rootScope.$broadcast.apply($rootScope, args);
    };
    this.listen = function (callback) {
      $rootScope.$on('ChartDateSelectedMsg', callback)
    }
  }]);

