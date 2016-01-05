#! /usr/bin/env bash

docker run -d --net=host geo-py \
-key $1 \
-rootDir / -bb $2 \
-start_date $3 -end_date $4 \
-es_index $5 -scrape_name $6
