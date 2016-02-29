"use strict";

 angular.module('loopbackApp.config', [])

.constant('ENV', {
  name:'production',
  apiUrl:'/api/',
  siteUrl:'',
  wsUrl: 'http://localhost:3001/',
  day: 1440, // mins
  period: 1,  // days
  geocoderApiKey: '6a66a1da021789e02248e956f89bdf28',
  geocoderEndpoint: 'https://api.opencagedata.com/geocode/v1/json',
  socialSandboxUrl: 'http://52.90.177.87'
})

;
