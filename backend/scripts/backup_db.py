"""
Daily database backup.

Usage (cron):
    0 2 * * *  /path/to/venv/python /path/to/backup_db.py

What it does:
    SQLite (dev / small):  copies db.sqlite3 with a date-stamped name.
    Postgres (prod):       runs `pg_dump` against $DATABASE_URL.

Output goes under backend/backups/<YYYY-MM-DD>.sql or .sqlite3.
Old backups beyond RETAIN_DAYS get pruned.
"""
import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
BACKUP_DIR = BASE_DIR / "backups"
RETAIN_DAYS = 30


def main() -> int:
    BACKUP_DIR.mkdir(exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d_%H%M")

    db_url = os.environ.get("DATABASE_URL", "")

    if db_url.startswith(("postgres://", "postgresql://")):
        out = BACKUP_DIR / f"backup-{today}.sql"
        print(f"[backup] postgres → {out}")
        rc = subprocess.call(["pg_dump", "--no-owner", "--no-privileges", "--file", str(out), db_url])
        if rc != 0:
            print("[backup] pg_dump failed", file=sys.stderr)
            return rc
    else:
        sqlite_path = BASE_DIR / "db.sqlite3"
        if not sqlite_path.exists():
            print("[backup] no db.sqlite3 found at expected path", file=sys.stderr)
            return 1
        out = BACKUP_DIR / f"backup-{today}.sqlite3"
        shutil.copy2(sqlite_path, out)
        print(f"[backup] sqlite → {out}")

    # Prune anything older than RETAIN_DAYS
    cutoff = datetime.now() - timedelta(days=RETAIN_DAYS)
    pruned = 0
    for f in BACKUP_DIR.iterdir():
        if not f.is_file():
            continue
        if datetime.fromtimestamp(f.stat().st_mtime) < cutoff:
            f.unlink()
            pruned += 1
    if pruned:
        print(f"[backup] pruned {pruned} old backups (>{RETAIN_DAYS} days)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
