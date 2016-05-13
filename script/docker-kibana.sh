#!/bin/bash

# within sense app, use 'elasticsearch' for local queries
# kibana + sense (for ES 2.1)
docker run --name kibana --link elasticsearch:elasticsearch -p 5601:5601 -d lukewendling/kibana:1
