'use strict';

const fs = require('fs');
const env = process.env;

module.exports = {
  // use docker-defined env vars to write datasources.json
  updateDatasources: () => {
    const mongoAddr = '"' + (env.MONGO_PORT_27017_TCP_ADDR || 'localhost') + '"';
    const mongoPort = env.MONGO_PORT_27017_TCP_PORT || 27017;
    const esAddr = '"' + (env.ELASTICSEARCH_PORT_9200_TCP_ADDR || 'localhost') + '"';
    const esPort = env.ELASTICSEARCH_PORT_9200_TCP_PORT || 9200;

    let fileContents = fs.readFileSync(__dirname + '/datasources-template.json', 'utf8');
    fileContents = fileContents.replace(/MONGO_HOST_ADDR/g, mongoAddr);
    fileContents = fileContents.replace(/MONGO_HOST_PORT/g, mongoPort);
    fileContents = fileContents.replace(/ES_HOST_ADDR/g, esAddr);
    fileContents = fileContents.replace(/ES_HOST_PORT/g, esPort);
    fs.writeFileSync(__dirname + '/datasources.json', fileContents);
  }
};
