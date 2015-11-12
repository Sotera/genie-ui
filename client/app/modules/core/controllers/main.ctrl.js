'use strict';
/**
 * @ngdoc function
 * @name com.module.core.controller:MainCtrl
 * @description Login Controller
 * @requires $scope
 * @requires $state
 * @requires $location
 * @requires CoreService
 * @requires User
 * @requires gettextCatalog
 **/
angular.module('com.module.core')
  .controller('MainCtrl', function ($scope, $rootScope, $state, $location, UserLoginOrLogoutMsg,
                                    CoreService, AminoUser, AppAuth, gettextCatalog) {
    //This currentUser is for filling out the Login screen and has nothing to do with
    //whether anyone is logged in
    UserLoginOrLogoutMsg.listen(function (_event, msg) {
      if(msg.action === 'initiate-logout'){
        AminoUser.logout(function () {
          $state.go('login');
          CoreService.toastSuccess(gettextCatalog.getString('Logged out'),
            gettextCatalog.getString('You are logged out!'));
          UserLoginOrLogoutMsg.broadcast({action: 'logout'});
        });
      }else if(msg.action === 'logout'){
        $scope.noOneLoggedIn = true;
      }else if(msg.action === 'login'){
        $scope.noOneLoggedIn = false;
      }
    });
    $scope.currentUser = AminoUser.getCurrent();
    //We have to call AppAuth to see if anyone is logged in
    $scope.noOneLoggedIn = !AppAuth.currentUser;
    $scope.menuoptions = $rootScope.menu;
    $scope.logout = function () {
      UserLoginOrLogoutMsg.broadcast({action: 'initiate-logout'});
    };
  });
