#!/usr/bin/env bash
# db.drop() doesn't fully remove so manually remove each collection
# usage drop-db [dbname(optional)]
defaultDb=genie
db=${1-$defaultDb}
mongo $db --eval "db.getCollectionNames().forEach(function(n){db[n].remove({})});"
