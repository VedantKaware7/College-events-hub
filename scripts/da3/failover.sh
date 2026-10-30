#!/usr/bin/env bash
# Q1c: stop one replica during a load test and count failed requests.
# Usage: scripts/da3/failover.sh basic|resilient
set -euo pipefail
cd "$(dirname "$0")/../.."
MODE=${1:?usage: failover.sh basic|resilient}
case $MODE in
    basic) CONF=./nginx/lb-basic.conf ;;
    resilient) CONF=./nginx/lb.conf ;;
    *) echo "unknown mode $MODE" >&2; exit 1 ;;
esac
N=${N:-5000}
C=${C:-50}
URL=http://127.0.0.1:8081/api/events
OUT=docs/da3-results/q1c-$MODE.txt
COMPOSE="docker compose -f docker-compose.lb.yml"

$COMPOSE up -d api1 api2 api3 >/dev/null 2>&1
NGINX_CONF=$CONF $COMPOSE up -d --no-deps --force-recreate lb >/dev/null 2>&1
sleep 15
ab -q -n 1000 -c "$C" "$URL" >/dev/null           # warm-up

{
    echo "== nginx config: $CONF"
    echo "== ab -r -s 90 -n $N -c $C $URL   (api2 is stopped ~3s into the run)"
    ab -r -s 90 -n "$N" -c "$C" "$URL" 2>&1 &
    AB=$!
    sleep 3
    echo "== $(date +%T) docker compose stop api2" >&2
    $COMPOSE stop api2 >/dev/null 2>&1
    wait $AB || true
} > "$OUT" 2>&1

echo "== nginx view of the run (status codes per replica)" >> "$OUT"
docker logs --since 150s ceh-lb 2>/dev/null | grep -o '" [0-9]\{3\} upstream=[^ ]*' \
    | sed 's/^" //' | sort | uniq -c >> "$OUT"
docker logs --since 150s ceh-lb 2>&1 | grep -E '\[(error|warn)\]' | head -5 >> "$OUT" || true

$COMPOSE start api2 >/dev/null 2>&1

printf '%-10s failed=%s non2xx=%s complete=%s  (%s)\n' "$MODE" \
    "$(awk '/^Failed requests/{print $3}' "$OUT")" \
    "$(awk '/^Non-2xx responses/{print $3}' "$OUT" | grep . || echo 0)" \
    "$(awk '/^Complete requests/{print $3}' "$OUT")" "$OUT"
