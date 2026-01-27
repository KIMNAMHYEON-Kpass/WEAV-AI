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

BACKUP_ROOT="${BACKUP_ROOT:-/Volumes/WEAVAI_2T/weavai-backups}"
DATE="$(date +%Y%m%d_%H%M%S)"

POSTGRES_DB="${POSTGRES_DB:-weavai}"
POSTGRES_USER="${POSTGRES_USER:-weavai_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

MINIO_DATA_DIR_DEFAULT="$INFRA_DIR/minio-data"
MINIO_DATA_DIR="${MINIO_DATA_DIR:-$MINIO_DATA_DIR_DEFAULT}"

mkdir -p "$BACKUP_ROOT/postgres" "$BACKUP_ROOT/minio/$DATE" "$BACKUP_ROOT/logs"

LOG_FILE="$BACKUP_ROOT/logs/backup_$DATE.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[backup] start: $DATE"

echo "[backup] postgres dump..."
if [[ -z "$POSTGRES_PASSWORD" ]]; then
  echo "[backup] WARN: POSTGRES_PASSWORD is empty; pg_dump may fail if auth is required"
fi

PG_DUMP_FILE="$BACKUP_ROOT/postgres/pg_${POSTGRES_DB}_$DATE.sql.gz"

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i weavai_postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$PG_DUMP_FILE"

echo "[backup] postgres dump saved: $PG_DUMP_FILE"

echo "[backup] minio data sync..."
if [[ ! -d "$MINIO_DATA_DIR" ]]; then
  echo "[backup] ERROR: MINIO_DATA_DIR not found: $MINIO_DATA_DIR"
  exit 1
fi

rsync -a "$MINIO_DATA_DIR/" "$BACKUP_ROOT/minio/$DATE/"

echo "[backup] minio data saved: $BACKUP_ROOT/minio/$DATE"

echo "[backup] done"
