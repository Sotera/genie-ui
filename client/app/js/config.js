"use strict";

 angular.module('loopbackApp.config', [])

.constant('ENV', {
  name:'production',
  apiUrl:'/api/',
  siteUrl:'',
  wsUrl: 'http://localhost:3001/',
  sandboxEventsUrl: 'http://localhost:9200/sandbox/event/_search'
})

;
