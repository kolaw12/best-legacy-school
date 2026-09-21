"""
Dump the PostgreSQL database to a timestamped SQL file.

Usage:
    python manage.py db_backup                     # save to BACKUP_DIR or ./backups/
    python manage.py db_backup --stdout             # print SQL to stdout
    python manage.py db_backup --cleanup --keep 7   # keep only last 7 backups

Set BACKUP_DIR env var to customize the output directory.
"""
import os
import sys
import glob
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Dump PostgreSQL database to a SQL file for backup."

    def add_arguments(self, parser):
        parser.add_argument('--stdout', action='store_true', help='Print SQL to stdout instead of file')
        parser.add_argument('--cleanup', action='store_true', help='Remove old backups, keeping --keep most recent')
        parser.add_argument('--keep', type=int, default=7, help='Number of backups to keep when --cleanup is used')

    def handle(self, *args, **options):
        db_url = os.environ.get('DATABASE_URL', '')
        if not db_url and not options['stdout']:
            self.stderr.write(self.style.ERROR('DATABASE_URL not set. Cannot backup.'))
            return

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'backup_{timestamp}.sql'

        backup_dir = Path(os.environ.get('BACKUP_DIR', 'backups'))
        backup_dir.mkdir(parents=True, exist_ok=True)
        filepath = backup_dir / filename

        if options['stdout']:
            # Stream to stdout (for piping to S3, email, etc.)
            cmd = f'pg_dump "{db_url}"'
            self.stdout.write(f'Running: {cmd}')
            os.system(cmd)
            return

        # Dump to file
        cmd = f'pg_dump "{db_url}" > "{filepath}"'
        self.stdout.write(f'Backing up database...')
        exit_code = os.system(cmd)

        if exit_code == 0:
            size = filepath.stat().st_size
            self.stdout.write(self.style.SUCCESS(
                f'Backup saved: {filepath} ({size / 1024:.1f} KB)'
            ))
        else:
            self.stderr.write(self.style.ERROR(f'pg_dump failed with exit code {exit_code}'))
            filepath.unlink(missing_ok=True)
            return

        # Cleanup old backups
        if options['cleanup']:
            backups = sorted(glob.glob(str(backup_dir / 'backup_*.sql')))
            if len(backups) > options['keep']:
                for old in backups[:-options['keep']]:
                    os.remove(old)
                    self.stdout.write(f'  Removed old backup: {old}')

        self.stdout.write(self.style.SUCCESS(
            f'\nTip: Add to crontab for daily backups:\n'
            f'  0 2 * * * cd {os.getcwd()} && python manage.py db_backup --cleanup --keep 7'
        ))
