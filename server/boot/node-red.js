'use strict';

// to enable these logs set `DEBUG=boot:node-red` or `DEBUG=boot:*`
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
  });
};
