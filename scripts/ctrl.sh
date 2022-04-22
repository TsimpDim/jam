#!/bin/bash
declare -A dcfiles=(
    ["core"]="docker-compose-core.yml"
    ["api"]="jobappman/docker-compose-api.yml"
)


if [ "$1" == "start" ]
then
    docker-compose -f ${dcfiles[$2]} up -d 
elif [ "$1" == "stop" ]
then
    docker-compose -f ${dcfiles[$2]} down
elif [ "$1" == "build" ]
then
    docker-compose -f ${dcfiles[$2]} build
fi