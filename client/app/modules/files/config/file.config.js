'use strict';
angular.module('com.module.files')
  .run(function($rootScope, $http, CoreService, gettextCatalog) {
    $rootScope.addMenu(gettextCatalog.getString('Files'), 'app.files.list',
      'fa-file');

    $http.get(CoreService.env.apiUrl + '/containers/files/files').success(
      function(data) {
        $rootScope.addDashboardBox(gettextCatalog.getString('Files'),
          'bg-blue5', 'ion-paperclip', data.length, 'app.files.list');
      });

  });
