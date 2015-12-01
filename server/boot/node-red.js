module.exports = function(app) {
  var REDsettings = {
    httpAdminRoot: "/red",
    httpNodeRoot: "/api",
    userDir: "/tmp/.nodered",
    functionGlobalContext: {} // enables global context
  };

  // Initialise the runtime with a server and settings
  app.RED.init(app.server, REDsettings);
  // Serve the editor UI from /red
  app.use(REDsettings.httpAdminRoot, app.RED.httpAdmin);
  // Serve the http nodes UI from /api
  app.use(REDsettings.httpNodeRoot, app.RED.httpNode);
};
