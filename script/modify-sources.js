#!/usr/bin/env node
// modify imported docs before loading
var jsonfile = require('jsonfile')

var infile = 'import/sandbox/sources.json'
var outfile = 'import/sandbox/sources2.json'
var modified = []

jsonfile.readFile(infile, function(err, oldArr) {
  console.error(err)
  oldArr.forEach(function(obj) {
    obj._source.post_date = '2014-08-17'
    modified.push(obj)
  })

  jsonfile.writeFile(outfile, modified, function(err) {
    console.error(err)
  })
})
