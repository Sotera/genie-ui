#!/usr/local/bin/node
const folderName = '/home/jreeme/src/hashTagClustering/raw_tweet_data/';
var fs = require('fs');
var path = require('path');
var glob = require('glob-fs')({gitignore: true});
const fileNames = glob.readdirSync('*.json',{cwd: folderName});
fileNames.forEach(function (fileName) {
  var lines = fs.readFileSync(path.join(folderName, fileName), 'utf8').split('\n');
  var tweets = lines.map(function (line) {
    try {
      return JSON.parse(line);
    } catch (err) {
      console.log(err);
    }
  });
  fs.writeFileSync(path.join(folderName + 'real-json/', fileName.replace('json', 'real.json')), JSON.stringify(tweets));
});

