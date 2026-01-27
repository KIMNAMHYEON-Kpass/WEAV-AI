#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEAVAI_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INFRA_DIR="$WEAVAI_ROOT/infra"
ENV_FILE="$INFRA_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

HEALTHCHECK_URLS="${HEALTHCHECK_URLS:-http://localhost:8080/healthz,http://localhost:8080/api/v1/health/}"
MONITOR_WEBHOOK_URL="${MONITOR_WEBHOOK_URL:-}"
MONITOR_WEBHOOK_FORMAT="${MONITOR_WEBHOOK_FORMAT:-slack}"
TIMEOUT_SECONDS="${HEALTHCHECK_TIMEOUT_SECONDS:-5}"

FAILED=0
FAIL_MSGS=()

IFS=',' read -r -a URLS <<< "$HEALTHCHECK_URLS"
for url in "${URLS[@]}"; do
  if ! curl -fsS --max-time "$TIMEOUT_SECONDS" "$url" >/dev/null; then
    FAILED=1
    FAIL_MSGS+=("$url")
  fi
done

if [[ "$FAILED" -eq 1 ]]; then
  TS="$(date '+%Y-%m-%d %H:%M:%S')"
  MSG="[WEAV-AI] health check failed ($TS): ${FAIL_MSGS[*]}"
  echo "$MSG"

  if [[ -n "$MONITOR_WEBHOOK_URL" ]]; then
    if [[ "$MONITOR_WEBHOOK_FORMAT" == "discord" ]]; then
      curl -fsS -X POST -H 'Content-Type: application/json' \
        -d "{\"content\":\"$MSG\"}" "$MONITOR_WEBHOOK_URL" >/dev/null || true
    else
      curl -fsS -X POST -H 'Content-Type: application/json' \
        -d "{\"text\":\"$MSG\"}" "$MONITOR_WEBHOOK_URL" >/dev/null || true
    fi
  fi
fi
