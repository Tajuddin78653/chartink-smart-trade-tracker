#!/bin/bash
# Backup PostgreSQL database
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

docker exec cstt_postgres pg_dump -U cstt_user chartink_tracker \
  > "$BACKUP_DIR/chartink_tracker_$DATE.sql"

echo "✅ Database backed up to $BACKUP_DIR/chartink_tracker_$DATE.sql"

# Keep only last 7 backups
ls -t $BACKUP_DIR/*.sql | tail -n +8 | xargs -r rm
echo "🗑️  Old backups cleaned (kept last 7)"
