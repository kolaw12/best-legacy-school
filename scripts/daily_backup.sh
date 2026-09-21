#!/bin/bash
# Daily database backup script
# Run via Render Cron Job or system crontab
#
# For Render: Set this as a Cron Job service in render.yaml
# For crontab: 0 2 * * * /path/to/scripts/daily_backup.sh
#
# To restore: psql $DATABASE_URL < backups/backup_YYYYMMDD_HHMMSS.sql

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting database backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

FILESIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
echo "[$(date)] Backup saved: $BACKUP_FILE ($(( FILESIZE / 1024 )) KB)"

# Keep only last 7 backups
cd "$BACKUP_DIR"
ls -t backup_*.sql 2>/dev/null | tail -n +8 | xargs -r rm -f
echo "[$(date)] Cleanup done. Kept last 7 backups."
