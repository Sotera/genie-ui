'use strict';
var app = angular.module('com.module.core');

app.service('WebSocketService', ['$websocket', '$location', '$rootScope', function ($websocket, $location, $rootScope) {
  var self = this;

  var absUrl = $location.absUrl();
  var url = new URL(absUrl);
  var hostname = url.hostname;
  var port = url.port;
  var webSocketBaseUrl = 'ws://' + hostname + ':' + port + '/api/ws/';

  self.open = function (socketName, socketOpenCB) {
    var socket = $websocket.$new(webSocketBaseUrl + socketName);
    socket.$on('$close', function () {
    });
    socket.$on('$open', function () {
      socket.subscribe = function (messageName, cb) {
        socket.$on(messageName, function(data){
          cb(data);
        });
      };
      socket.send = function (messageName, data) {
        socket.$emit(messageName, data);
      }
      socketOpenCB(socket);
    });
  };
}]);
