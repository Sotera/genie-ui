#! /usr/bin/env bash
# usage: ./create-mock-sources
# delete index and bulk import from file

set -u

host_port="localhost:9200"
index="${host_port}/hashtags"
t="event" # type

echo Creating $index/$t

curl -X DELETE $index
curl -XPUT $index

# specify type to support range queries
curl -X PUT $index/$t/_mapping -d '{
  "event": {
    "properties": {
      "post_date": {
        "type": "date",
        "format": "date_optional_time"
      },
      "indexed_date": {
        "type": "date",
        "format": "date_optional_time"
      }
    }
  }
}
'

curl -X POST $index/$t/_bulk --data-binary @import/hashtag/ferguson-sources.json
curl $index/$t/_search
