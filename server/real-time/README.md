### Genie web socket server

## Dependencies

1. Node 4.2

## Develop

```
cp .env.template .env
npm install
npm run dev
```

## Docker

```
cp .env.template .env # and update as needed
docker build --no-cache --force-rm -t genie-realtime .
docker run -d -p 3001:3001 --name genie --env-file .env genie-realtime
```
