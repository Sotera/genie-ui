"use strict";

 angular.module('loopbackApp.config', [])

.constant('ENV', {
  name:'production',
  apiUrl:'/api/',
  siteUrl:'',
  wsUrl: 'http://localhost:3001/',
  tweetsUrl: 'http://172.21.10.140:9200/jag_hc2_documents/post/_search'
})

;
