'use strict';
/**
 * @ngdoc function
 * @name com.module.users.controller:LoginCtrl
 * @description Login Controller
 * @requires $scope
 * @requires $routeParams
 * @requires $location
 * Contrller for Login Page
 **/
angular.module('com.module.users')
  .controller('LoginCtrl', function ($scope, $routeParams, $location, UserLoginOrLogoutMsg,
                                     CoreService, AminoUser, AppAuth, gettextCatalog) {
    var TWO_WEEKS = 1000 * 60 * 60 * 24 * 7 * 2;
    UserLoginOrLogoutMsg.listen(function () {
    });
    $scope.credentials = {
      ttl: TWO_WEEKS,
      rememberMe: true
    };
    if (CoreService.env.name === 'development') {
      $scope.credentials.email = 'admin@admin.com';
      $scope.credentials.password = 'admin';
    }
    $scope.formlyFields = [
      {
        key: 'email',
        type: 'input',
        templateOptions:{
          label: 'Username (e-mail)',
          type: 'email',
          placeholder: 'Enter Address'
        }
      },
      {
        key: 'password',
        type: 'input',
        templateOptions:{
          label: 'Password',
          type: 'password',
          placeholder: 'Password'
        }
      }
    ];
    $scope.login = function () {
      AminoUser.login({
        include: 'user',
        rememberMe: $scope.credentials.rememberMe
      }, $scope.credentials).$promise
        .then(function (userInfo) {
          var next = $location.nextAfterLogin || '/';
          $location.nextAfterLogin = null;
          AppAuth.currentUser = userInfo.user;
          AppAuth.currentUser.accessToken = userInfo.id;
          //Find a little more out about our current user
          AminoUser.findOne({
            filter: {
              where: {
                id: AppAuth.currentUser.id
              },
              include: ['roles', 'accessTokens']
            }
          }).$promise
            .then(function (user) {
              AppAuth.currentUser.roles = user.roles;
              var admins = AppAuth.currentUser.roles.filter(function (u) {
                return u.name === 'admins';
              });
              AppAuth.currentUser.isAdmin = (admins.length > 0);
              //And now toast our login success!
              CoreService.toastSuccess(gettextCatalog.getString('Logged in'),
                gettextCatalog.getString('You are logged in!'));
              if (next === '/login') {
                next = '/';
              }
              $location.path(next);
              var msg = {
                action: 'login',
                user: AppAuth.currentUser
              }
              UserLoginOrLogoutMsg.broadcast(msg);
            })
            .catch(function (err) {
              $scope.loginError = err.data.error;
            });
        })
        .catch(function (err) {
          $scope.loginError = err.data.error;
        });
    };
  });
