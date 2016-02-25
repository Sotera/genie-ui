#!/bin/bash
docker run -dt --name elasticsearch -e ES_HEAP_SIZE=4g -h elasticsearch -p 9200:9200 elasticsearch
