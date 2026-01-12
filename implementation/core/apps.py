from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Import inside ready to avoid circular imports
        try:
            from .ml_engine import ml_engine
            # Training on startup
            ml_engine.train()
        except:
            pass
