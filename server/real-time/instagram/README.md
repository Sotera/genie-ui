# Instagram scraper

## Docker

```
docker build --no-cache --force-rm -t geo-py .
docker run -d --net=host geo-py -key <ACCESS_TOKEN> -start_date 2015122900 -rootDir / -bb 30.298203605616226,-97.68630981445312,30.321915039121063,-97.65609741210938 -scrape_name austin -es http://localhost:9200 -es_index instagram
```
