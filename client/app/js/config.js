"use strict";

 angular.module('loopbackApp.config', [])

.constant('ENV', {
  name:'production',
  apiUrl:'/api/',
  siteUrl:'',
  day: 1440, // mins
  period: 1,  // days
})

;
