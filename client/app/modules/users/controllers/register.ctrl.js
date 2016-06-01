'use strict';
/**
 * @ngdoc function
 * @name com.module.users.controller:RegisterCtrl
 * @description Login Controller
 * @requires $scope
 * @requires $routeParams
 * @requires $location
 * Controller for Register Page
 **/
angular.module('com.module.users')
  .controller('RegisterCtrl', function($scope, $routeParams, $location, $filter,
    CoreService, AminoUser, AppAuth, gettextCatalog) {

    $scope.registration = {
      firstName: null,
      lastName: null,
      email: null,
      password: null
    };

    $scope.formlyFields = [
      {
        key: 'firstName',
        type: 'input',
        templateOptions:{
          label: 'First Name',
          placeholder: 'First Name'
        }
      }
      ,{
        key: 'lastName',
        type: 'input',
        templateOptions:{
          label: 'Last Name',
          placeholder: 'Last Name'
        }
      }
      ,{
        key: 'email',
        type: 'input',
        templateOptions:{
          label: 'Email Address',
          type: 'email',
          placeholder: 'Email Address'
        }
      }
      ,{
        key: 'password',
        type: 'input',
        templateOptions:{
          label: 'Password',
          placeholder: 'Password'
        }
      }
    ];
    $scope.register = function() {
      $scope.registration.username = $scope.registration.email;
      $scope.user = AminoUser.save($scope.registration,
        function() {
          $scope.loginResult = AminoUser.login({
              include: 'user',
              rememberMe: true
            }, $scope.registration,
            function() {
              AppAuth.currentUser = $scope.loginResult.user;
              CoreService.toastSuccess(gettextCatalog.getString(
                'Registered'), gettextCatalog.getString(
                'You are registered!'));
              $location.path('/');
            },
            function(res) {
              CoreService.toastWarning(gettextCatalog.getString(
                  'Error signin in after registration!'), res.data.error
                .message);
              $scope.loginError = res.data.error;
            }
          );
        },
        function(res) {
          CoreService.toastError(gettextCatalog.getString(
            'Error registering!'), res.data.error.message);
          $scope.registerError = res.data.error;
        }
      );
    };
  });
