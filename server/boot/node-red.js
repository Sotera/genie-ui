'use strict';

// to enable these logs set `DEBUG=boot:node-red` or `DEBUG=boot:*`
const webSocketServiceName = 'node-red-to-loopback-service-channel';
var log = require('debug')('boot:node-red');
var async = require('async');
var getSettings = require('../util/getSettings');

module.exports = function (app, cb) {
  getSettings([
    'nodeRedFlowFile',
    'nodeRedNodesFolder',
    'nodeRedNodeRoot',
    'nodeRedAdminRoot',
    'nodeRedFlowsFolder'
  ], function (settings) {
    var REDsettings = {
      httpAdminRoot: settings['nodeRedAdminRoot'],
      httpNodeRoot: settings['nodeRedNodeRoot'],
      userDir: settings['nodeRedFlowsFolder'],
      nodesDir: settings['nodeRedNodesFolder'],
      flowFile: settings['nodeRedFlowFile'],
      functionGlobalContext: {} // enables global context
    };

    // Initialise the runtime with a server and settings
    app.RED.init(app.server, REDsettings);
    // Serve the editor UI from /red
    app.use(REDsettings.httpAdminRoot, app.RED.httpAdmin);
    // Serve the http nodes UI from /api
    app.use(REDsettings.httpNodeRoot, app.RED.httpNode);
    cb();

    var WebSocketClient = require('websocket').client;
    var wsc = new WebSocketClient();
    wsc.on('connectFailed', function () {
      log('Connection to "' + webSocketServiceName + '" FAILED')
      connectAfterWaiting(app, wsc);
    });
    wsc.on('connect', function (cnx) {
      log('Connection to "' + webSocketServiceName + '" SUCCEEDED')
      //Setup some socket events to try to keep things cool
      cnx.on('error', function (error) {
        log('Connection error on "' + webSocketServiceName + '": ' + error);
      });
      cnx.on('close', function () {
        log('Connection to "' + webSocketServiceName + '" CLOSED');
        connectAfterWaiting(app, wsc);
      });
      cnx.on('message', function (msg) {
        log('Message from "' + webSocketServiceName + '": ' + msg);
      });
      setTimeout(function () {
        var host_port = getHostAndPort(app);
        var configInfo = {
          url: host_port
        };
        var configInfoJson = JSON.stringify(configInfo);
        log('Sending config info to "' + webSocketServiceName + '": ' + configInfoJson);
        cnx.sendUTF(configInfoJson);
      }, 3000);
    });
    connectAfterWaiting(app, wsc);
  });
};

function connectAfterWaiting(app, wsc) {
  setTimeout(function () {
    var cnxString = 'ws://' + getHostAndPort(app) + '/api/ws/' + webSocketServiceName;
    log('Attempting connection to: ' + cnxString);
    wsc.connect(cnxString);
  }, 2000);
}

function getHostAndPort(app) {
  var baseUrl = app.get('url').replace(/\/$/, '');
  var host_port = baseUrl.slice('http://'.length);
  return host_port;
}
