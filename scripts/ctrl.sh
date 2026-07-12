#!/bin/bash
declare -A dcfiles=(
    ["core"]="docker-compose-core.yml"
    ["api"]="jam-api/docker-compose-api.yml"
    ["client"]="jam-client/docker-compose-client.yml"
)

if [[ $1 == "test" ]]; then
    if [[ $2 == "api" ]]; then
        docker exec jobappman-api python manage.py test jam auth special extapi --settings=core.settings.test
    else
        echo "Tests are only available for the api service."
        exit 1
    fi
    exit $?
fi

if [[ $1 == "start" ]]; then
    cmd="up -d"
else
    cmd=$1
fi

if [[ $2 == "all" ]]; then
    for key in "${!dcfiles[@]}"; do
        docker compose -f ${dcfiles[$key]} $cmd
    done
else
    docker compose -f ${dcfiles[$2]} $cmd
fi
