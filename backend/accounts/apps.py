from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"
    verbose_name = "Accounts & Access"

    def ready(self):
        # Connect audit signals
        from . import signals  # noqa: F401
