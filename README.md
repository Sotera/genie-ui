# GENIE

```
cp server/config.json.template server/config.json
npm install -g strongloop
npm install
lb-ng server/server.js client/app/js/lb-services.js # if models change
```

### Real-time tweets

```
cp .env.template .env
cp server/config.json.template server/config.json
npm run realtime
```

### Fetch clustered events

```
./script/setup
```
