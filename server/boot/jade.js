'use strict';
module.exports = function (app) {
  var path = require('path');
  var pathToModules = path.join(__dirname, '../../client/app/modules');
  app.set('view engine', 'jade');
  app.set('views', pathToModules);

  app.get(
    ['/modules/:module/views/:view',
      '/modules/:module/views/:elements/:view'], function (req, res) {
      var module = req.params.module;
      var view = req.params.view;
      var elements = req.params.elements
        ? '/' + req.params.elements + '/'
        : '/';
      var url = module + '/views' + elements + view;
      if(/html$/i.test(url)){
        res.sendFile(url, {root: pathToModules});
      }else{
        res.render(url, {title: 'Auto'});
      }
    });
};
