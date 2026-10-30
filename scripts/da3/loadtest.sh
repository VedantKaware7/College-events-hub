#!/usr/bin/env bash
# Q1b: 1,000 requests via nginx with 1 replica, then 3 (warm-up + 5 runs each).
# Usage: scripts/da3/loadtest.sh [concurrency]
set -euo pipefail
cd "$(dirname "$0")/../.."
C=${1:-50}
N=1000
URL=http://127.0.0.1:8081/api/events
OUT=docs/da3-results
COMPOSE="docker compose -f docker-compose.lb.yml"

wait_healthy() {
    for _ in $(seq 1 30); do
        curl -sf -o /dev/null http://127.0.0.1:8081/api/health && return 0
        sleep 1
    done
    echo "load balancer not healthy" >&2; exit 1
}

run_setup() {   # $1 = label, $2 = nginx config
    local label=$1
    NGINX_CONF=$2 $COMPOSE up -d --no-deps --force-recreate lb >/dev/null 2>&1
    wait_healthy
    ab -q -n 1000 -c "$C" "$URL" >/dev/null          # warm-up
    for run in 1 2 3 4 5; do
        ab -n $N -c "$C" "$URL" > "$OUT/q1b-${label}-run${run}.txt" 2>&1
        printf '%-11s run %s  %8s req/s  %8s ms mean  failed=%s non2xx=%s\n' "$label" "$run" \
            "$(awk '/Requests per second/{print $4}' "$OUT/q1b-${label}-run${run}.txt")" \
            "$(awk '/Time per request.*\(mean\)$/{print $4}' "$OUT/q1b-${label}-run${run}.txt")" \
            "$(awk '/Failed requests/{print $3}' "$OUT/q1b-${label}-run${run}.txt")" \
            "$(awk '/Non-2xx responses/{print $3}' "$OUT/q1b-${label}-run${run}.txt" | grep . || echo 0)"
    done
}

echo "ab -n $N -c $C $URL"
$COMPOSE up -d api1 >/dev/null 2>&1
$COMPOSE stop api2 api3 >/dev/null 2>&1
run_setup 1-instance ./nginx/lb-single.conf

$COMPOSE up -d api2 api3 >/dev/null 2>&1
sleep 15
run_setup 3-instances ./nginx/lb.conf
