#!/bin/bash
declare -A dcfiles=(
    ["core"]="docker-compose-core.yml"
    ["api"]="jobappman/docker-compose-api.yml"
)


docker-compose -f ${dcfiles[$2]} $1