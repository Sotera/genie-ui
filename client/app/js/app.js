'use strict';
/**
 * @ngdoc overview
 * @name loopbackApp
 * @description
 * # loopbackApp
 *
 * Main module of the application.
 *
 *** The order of the modules here controls the order that they appear in the toolbar on the left of the application ***
 */
angular.module('loopbackApp', [
    //'angular-loading-bar',
    //'angular.filter',
    //'angularBootstrapNavTree',
    //'isteven-multi-select',
    //'btford.markdown',
    'oitozero.ngSweetAlert',
    'loopbackApp.config',
    'formly',
    'formlyBootstrap',
    'lbServices',
    //'monospaced.elastic',
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngWebsocket',
    'ngCookies',
    'ui.bootstrap',
    //'ui.codemirror',
    'ui.gravatar',
    //'ui.grid',
    'smart-table',
    'ui.router',
    //'ui.layout',
    'angular-toasty',
    'gettext',
    'com.module.core',
    'com.module.about',
    'genie.eventsMap',
    'com.module.stats',
    'com.module.settings',
    'com.module.users'
  ])
  .run(function ($rootScope, $cookies, gettextCatalog) {
    $rootScope.locales = {
      'de': {
        lang: 'de',
        country: 'DE',
        name: gettextCatalog.getString('German')
      },
      'en': {
        lang: 'en',
        country: 'US',
        name: gettextCatalog.getString('English')
      },
      'fr': {
        lang: 'fr',
        country: 'FR',
        name: gettextCatalog.getString('Français')
      },
      'nl': {
        lang: 'nl',
        country: 'NL',
        name: gettextCatalog.getString('Dutch')
      },
      'pt-BR': {
        lang: 'pt_BR',
        country: 'BR',
        name: gettextCatalog.getString('Portuguese Brazil')
      },
      'ru_RU': {
        lang: 'ru_RU',
        country: 'RU',
        name: gettextCatalog.getString('Russian')
      }
    }
    var lang = $cookies.lang || navigator.language || navigator.userLanguage;
    $rootScope.locale = $rootScope.locales[lang];
    if ($rootScope.locale === undefined) {
      $rootScope.locale = $rootScope.locales[lang];
      if ($rootScope.locale === undefined) {
        $rootScope.locale = $rootScope.locales['en'];
      }
    }
    gettextCatalog.setCurrentLanguage($rootScope.locale.lang);
  });
