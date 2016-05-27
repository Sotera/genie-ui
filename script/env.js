#!/usr/bin/env node
require('dotenv').config({silent: true});

// create browser global object to store system vars in browser.
// used in npm scripts in package.json

const browserEnvVars = {
  GEOCODER_API_KEY: process.env.GEOCODER_API_KEY,
  GEOCODER_ENDPOINT: process.env.GEOCODER_ENDPOINT,
  NODE_ENV: process.env.NODE_ENV
};

process.stdout.write("GenieEnv = " + JSON.stringify(browserEnvVars));
