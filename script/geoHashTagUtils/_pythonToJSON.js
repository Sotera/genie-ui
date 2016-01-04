#!/usr/local/bin/node
const folderName = '/home/jreeme/src/hashTagClustering/raw_tweet_data/';
var fs = require('fs');
var path = require('path');
const fileNames = [
  '2016-01-02_07:01:44.003319.json',
  '2016-01-02_06:55:36.713734.json',
  '2016-01-02_06:52:29.395153.json',
  '2016-01-02_06:58:40.889817.json'
];
fileNames.forEach(function(fileName){
  var lines = fs.readFileSync(path.join(folderName, fileName),'utf8').split('\n');
  var tweets = lines.map(function(line){
    try{
      return JSON.parse(line);
    }catch(err){
      console.log(err);
    }
  });
  fs.writeFileSync(path.join(folderName + 'real-json/', fileName.replace('json','real.json')),JSON.stringify(tweets));
});

