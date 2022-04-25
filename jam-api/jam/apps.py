from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'jam'

    def ready(self):
        import jam.signals