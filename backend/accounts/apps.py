from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
    verbose_name = "Accounts & Access"

    def ready(self):
        # Connect audit signals
        from . import signals  # noqa: F401

        # Auto-seed on startup (safe — checks before creating)
        import sys
        if 'migrate' not in sys.argv and 'makemigrations' not in sys.argv:
            self._auto_seed()

    def _auto_seed(self):
        """Ensure admin user exists with correct password and profile."""
        try:
            from django.contrib.auth.models import User
            from accounts.models import UserProfile, Role

            # Get or create the admin user
            user, created = User.objects.get_or_create(
                username='admin',
                defaults={
                    'email': 'admin@bestlegacy.sch',
                    'first_name': 'School',
                    'last_name': 'Admin',
                    'is_staff': True,
                },
            )

            # Always ensure password is correct (idempotent)
            if not user.check_password('admin123'):
                user.set_password('admin123')
                user.save(update_fields=['password'])
                print('[auto-seed] Reset admin password')

            # Always ensure profile exists with correct role
            profile, p_created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': Role.SCHOOL_ADMIN},
            )
            if profile.role != Role.SCHOOL_ADMIN:
                profile.role = Role.SCHOOL_ADMIN
                profile.save(update_fields=['role'])

            if created:
                print('[auto-seed] Created admin user: admin / admin123')
            else:
                print('[auto-seed] Admin user verified')

        except Exception as e:
            # Don't crash — DB might not be migrated yet on first boot
            import logging
            logging.getLogger('accounts').warning(f'Auto-seed skipped: {e}')
