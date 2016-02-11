# GENIE

## Dependencies

1. Node 4.2
1. Strongloop
1. Bower
1. Elasticsearch 2.0+
1. Mongo 2.6+

## Install

```
cp server/config.json.template server/config.json
touch .twitter-keys.json # ask a friend!
npm install -g strongloop bower
npm install
# only if models change...
lb-ng server/server.js client/app/js/lb-services.js
```

## Dev boostrap

```
npm run dev
./script/setup.js
```
