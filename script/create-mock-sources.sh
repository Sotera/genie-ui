#! /usr/bin/env bash
# usage ./create-mock-sources
# delete index and bulk import from file
curl -X DELETE localhost:9200/genie

# specify type to support range queries
curl -XPUT localhost:9200/genie -d '{
  "mappings": {
    "post": {
      "properties": {
        "post_date": {
          "type": "date"
        },
        "indexed_date": {
          "type": "date"
        }
      }
    }
  }
}
'

curl -X POST localhost:9200/genie/post/_bulk --data-binary @import/ferguson-sources.json

curl localhost:9200/genie/post/_search
