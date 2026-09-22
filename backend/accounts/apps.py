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
        """Create admin user only if it doesn't exist. Never reset password."""
        try:
            from django.contrib.auth.models import User
            from accounts.models import UserProfile, Role

            # Only create if admin user doesn't exist at all
            if User.objects.filter(username='admin').exists():
                # User exists — just verify profile, never touch password
                user = User.objects.get(username='admin')
                profile, _ = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'role': Role.SCHOOL_ADMIN},
                )
                if profile.role != Role.SCHOOL_ADMIN:
                    profile.role = Role.SCHOOL_ADMIN
                    profile.save(update_fields=['role'])
                return

            # First time only — create the admin user
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
            import logging
            logging.getLogger('accounts').warning(f'Auto-seed skipped: {e}')
