#!/bin/bash
declare -A dcfiles=(
    ["core"]="docker-compose-core.yml"
    ["api"]="jam-api/docker-compose-api.yml"
    ["client"]="jam-client/docker-compose-client.yml"
)

if [[ $1 == "start" ]]; then
    docker-compose -f ${dcfiles[$2]} up -d
else
    docker-compose -f ${dcfiles[$2]} $1
fi