#!/usr/local/bin/node
const folderName = '/home/jreeme/src/hashTagClustering/raw_tweet_data/';
var fs = require('fs');
var path = require('path');
var glob = require('glob-fs')({gitignore: true});
const fileNames = glob.readdirSync('*.json',{cwd: folderName});
fileNames.forEach(function (fileName) {
  var lines = fs.readFileSync(path.join(folderName, fileName), 'utf8').split('\n');
  var tweets = [];
  for(var i = 0;i < lines.length;++i){
    if(lines[i].length){
      try{
        tweets.push(JSON.parse(lines[i]));
      }catch(err){
        console.log('JSON parse failure: ' + err);
      }
    }
  }
  console.log('Writing: ' + fileName);
  fs.writeFileSync(path.join(folderName + 'real-json/', fileName.replace('json', 'real.json')), JSON.stringify(tweets));
});

