'use strict';
angular.module('com.module.settings')
  .run(function($rootScope, gettextCatalog) {
    $rootScope.addMenu(gettextCatalog.getString('Settings'), 'app.settings.list', 'fa-cog');

    $rootScope.getSetting = function(key) {
      var valor = '';
      angular.forEach($rootScope.settings.data, function(item) {
        if (item.key === key) {
          valor = item.value;
        }
      });
      return valor;
    };

    $rootScope.getCollapsedStatus = function(){
        if(angular.element('.left-side.sidebar-offcanvas.collapse-left').length >0){
            return("collapse-left");
        }
    };

    $rootScope.getStretchedStatus = function(){
        if(angular.element('.right-side.at-view-fade-in.at-view-fade-out.strech').length >0){
            return("strech");
        }
    }

  });
