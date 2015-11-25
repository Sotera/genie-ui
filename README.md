# GENIE

```
npm install -g strongloop
npm install
lb-ng server/server.js client/app/js/lb-services.js # if models change
```

### Real-time tweets

```
cp .env.template .env
npm run realtime
```

### Fetch clustered events

```
node tasks/clustered-events.js
```