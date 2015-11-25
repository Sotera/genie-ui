"use strict";

 angular.module('loopbackApp.config', [])

.constant('ENV', {
  name:'production',
  apiUrl:'/api/',
  siteUrl:'',
  wsUrl: 'http://localhost:3001/'
})

;
