#!/usr/bin/env bash
# Q1a: count which replica served each request.
# Usage: scripts/da3/distribution.sh [requests]   (stack from docker-compose.lb.yml must be running)
set -euo pipefail
N=${1:-30}
LB=${LB:-http://127.0.0.1:8081}

echo "== $N x GET $LB/api/events  (replica taken from the X-Instance response header)"
for i in $(seq 1 "$N"); do
    curl -s -o /dev/null -D - "$LB/api/events" | tr -d '\r' | awk -F': ' 'tolower($1)=="x-instance"{print $2}'
done | sort | uniq -c | awk '{printf "  %-6s served %s requests\n", $2, $1}'

echo
echo "== GET $LB/api/health x 3"
for i in 1 2 3; do curl -s "$LB/api/health"; echo; done

echo
echo "== Last 9 lines of the nginx access log (upstream address + replica)"
docker logs ceh-lb 2>/dev/null | grep 'upstream=' | tail -9
