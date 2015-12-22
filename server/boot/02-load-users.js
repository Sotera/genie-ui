'use strict';
// to enable these logs set `DEBUG=boot:02-load-users` or `DEBUG=boot:*`
var async = require('async');
var log = require('debug')('boot:02-load-users');
var LoopbackModelHelper = require('../util/loopback-model-helper');
var aminoUserHelper = new LoopbackModelHelper('AminoUser');
var roleHelper = new LoopbackModelHelper('Role');
var roleMappingHelper = new LoopbackModelHelper('RoleMapping');
module.exports = function (app,cb) {
  var roles = [{name: 'admins'}, {name: 'users'}, {name: 'guests'}];
  var adminUsers = [{
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@admin.com',
    username: 'admin',
    password: 'admin'
  }, {
    firstName: 'John',
    lastName: 'Reeme',
    email: 'jreeme@gmail.com',
    username: 'jreeme',
    password: 'password'
  }];

  var queries = roles.map(function (role) {
    return {where: {name: role.name}};
  })
  roleHelper.findOrCreateMany(queries, roles, function(err, createdAdminRoles){
    if(err){
      log(err);
      cb();
      return;
    }
    queries = adminUsers.map(function (user) {
      return {where: {username: user.username}};
    })
    aminoUserHelper.findOrCreateMany(queries, adminUsers, function(err, createdAdminUsers){
      if(err){
        log(err);
        cb();
        return;
      }
      var adminRoles  = createdAdminRoles.filter(function (role) {
          return role.name === 'admins';
        });
      async.each(adminRoles, function(adminRole, adminRolesCallback){
        async.each(createdAdminUsers, function(createdAdminUser, createdAdminUserCallback){
          adminRole.principals(function (err, roleMappings) {
            if (!roleMappings.length) {
              adminRole.principals.create(
                {
                  principalType: app.models.RoleMapping.USER,
                  principalId: createdAdminUser.id
                },
                function (err, roleMapping) {
                  if (err) {
                    log('error creating rolePrincipal', err);
                  } else {
                    log('created roleMapping: ' + roleMapping);
                  }
                  createdAdminUserCallback(err);
                }
              );
            }else{
              createdAdminUserCallback(err);
            }
          });
        }, function(err){
          adminRolesCallback(err);
        });
      },
      function(err){
        if(err){
          log(err);
        }
        cb();
      });
    });
  });
};
