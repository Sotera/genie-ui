"use strict";

 angular.module('loopbackApp.config', [])

.constant('ENV', {
  name:'production',
  apiUrl:'/api/',
  siteUrl:'',
  wsUrl: 'http://localhost:3001/',
  tweetsUrl: 'http://localhost:9200/tweets/post/_search'
})

;
