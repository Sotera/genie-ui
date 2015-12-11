'use strict';
module.exports = function (app) {
  var path = require('path');
  app.set('view engine', 'jade');
  app.set('views', path.join(__dirname, '../../client/app/modules'));

  /*About*/
  app.get('/modules/about/views/main', function (req, res) {
    res.render('about/views/main', {title: 'Main'});
  });
  app.get('/modules/about/views/about', function (req, res) {
    res.render('about/views/about', {title: 'About'});
  });
  app.get('/modules/about/views/chip', function (req, res) {
    res.render('about/views/chip', {title: 'Chip'});
  });


  /* Core */
  app.get('/modules/core/views/home', function (req, res) {
    res.render('core/views/home', {title: 'Home'});
  });
  app.get('/modules/core/views/app', function (req, res) {
    res.render('core/views/app', {title: 'App'});
  });
  app.get('/modules/core/views/elements/admin-header', function (req, res) {
    res.render('core/views/elements/admin-header', {title: 'admin-header'});
  });
  app.get('/modules/core/views/elements/navbar', function (req, res) {
    res.render('core/views/elements/navbar', {title: 'navbar'});
  });
  app.get('/modules/core/views/elements/small-box', function (req, res) {
    res.render('core/views/elements/small-box', {title: 'small-box'});
  });

  /* Events Map */
  app.get('/modules/events-map/views/main', function (req, res) {
    res.render('events-map/views/main', {title: 'Events'});
  });
  app.get('/modules/events-map/views/map', function (req, res) {
    res.render('events-map/views/map', {title: 'Events'});
  });
  app.get('/modules/events-map/views/chipmap', function (req, res) {
    res.render('events-map/views/chipmap', {title: 'MiniMap'});
  });

  /*Blank*/
  app.get('/modules/blank/views/main', function (req, res) {
    res.render('blank/views/main', {title: 'Main'});
  });
  app.get('/modules/blank/views/list', function (req, res) {
    res.render('blank/views/list', {title: 'List'});
  });
  app.get('/modules/blank/views/chip', function (req, res) {
    res.render('blank/views/chip', {title: 'Chip'});
  });

  /*Stats*/
  app.get('/modules/stats/views/main', function (req, res) {
    res.render('stats/views/main', {title: 'Main'});
  });
  app.get('/modules/stats/views/list', function (req, res) {
    res.render('stats/views/list', {title: 'List'});
  });
  app.get('/modules/stats/views/chip', function (req, res) {
    res.render('stats/views/chip', {title: 'Chip'});
  });

  /* Users */
  app.get('/modules/users/views/main', function (req, res) {
    res.render('users/views/main', {title: 'Main'});
  });
  app.get('/modules/users/views/list', function (req, res) {
    res.render('users/views/list', {title: 'List'});
  });
  app.get('/modules/users/views/form', function (req, res) {
    res.render('users/views/form', {title: 'Form'});
  });
  app.get('/modules/users/views/login', function (req, res) {
    res.render('users/views/login', {title: 'Login'});
  });
  app.get('/modules/users/views/register', function (req, res) {
    res.render('users/views/register', {title: 'Login'});
  });

  /* Settings */
  app.get('/modules/settings/views/main', function (req, res) {
    res.render('settings/views/main', {title: 'Main'});
  });
  app.get('/modules/settings/views/list', function (req, res) {
    res.render('settings/views/list', {title: 'List'});
  });
  app.get('/modules/settings/views/view', function (req, res) {
    res.render('settings/views/view', {title: 'View'});
  });
  app.get('/modules/settings/views/form', function (req, res) {
    res.render('settings/views/form', {title: 'Form'});
  });

};
