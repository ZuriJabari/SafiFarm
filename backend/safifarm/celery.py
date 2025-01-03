import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'safifarm.settings')

app = Celery('safifarm')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Configure periodic tasks
app.conf.beat_schedule = {
    'send-booking-reminders': {
        'task': 'api.tasks.send_booking_reminder',
        'schedule': crontab(minute='*/5'),  # Run every 5 minutes
    },
    'check-payment-expiry': {
        'task': 'api.tasks.check_payment_expiry',
        'schedule': crontab(minute='*/5'),  # Run every 5 minutes
    },
    'check-analysis-timeout': {
        'task': 'api.tasks.check_analysis_timeout',
        'schedule': crontab(minute='*/5'),  # Run every 5 minutes
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 