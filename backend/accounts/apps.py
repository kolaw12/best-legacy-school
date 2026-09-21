from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
    verbose_name = "Accounts & Access"

    def ready(self):
        # Connect audit signals
        from . import signals  # noqa: F401

        # Auto-seed admin user on startup if it doesn't exist
        # Only runs in production (when DB is ready) and avoids double-seeding
        import os
        import sys
        if 'migrate' not in sys.argv and 'makemigrations' not in sys.argv:
            self._auto_seed()

    def _auto_seed(self):
        """Create admin user if no school_admin exists. Safe to run multiple times."""
        try:
            from django.contrib.auth.models import User
            from accounts.models import UserProfile, Role

            # Skip if a school_admin already exists
            if UserProfile.objects.filter(role=Role.SCHOOL_ADMIN).exists():
                return

            # Also skip if the admin user already exists with a password
            if User.objects.filter(username='admin').exists():
                return

            # Create admin user
            user = User.objects.create_user(
                username='admin',
                email='admin@bestlegacy.sch',
                password='admin123',
                first_name='School',
                last_name='Admin',
                is_staff=True,
            )
            UserProfile.objects.create(user=user, role=Role.SCHOOL_ADMIN)
            print('[auto-seed] Created admin user: admin / admin123')
        except Exception as e:
            # Don't crash the server if seeding fails (DB might not be ready yet)
            print(f'[auto-seed] Skipped: {e}')
