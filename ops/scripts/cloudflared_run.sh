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

CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-cloudflared}"
CLOUDFLARED_CONFIG="${CLOUDFLARED_CONFIG:-$HOME/.cloudflared/config.yml}"
CLOUDFLARED_TUNNEL_NAME="${CLOUDFLARED_TUNNEL_NAME:-}"
ENABLE_EXTERNAL_ACCESS="${ENABLE_EXTERNAL_ACCESS:-false}"

if [[ "$ENABLE_EXTERNAL_ACCESS" != "true" ]]; then
  echo "[cloudflared] external access disabled (ENABLE_EXTERNAL_ACCESS=false)"
  exit 0
fi

if [[ -n "$CLOUDFLARED_TUNNEL_NAME" ]]; then
  exec "$CLOUDFLARED_BIN" tunnel run --config "$CLOUDFLARED_CONFIG" "$CLOUDFLARED_TUNNEL_NAME"
else
  exec "$CLOUDFLARED_BIN" tunnel run --config "$CLOUDFLARED_CONFIG"
fi
