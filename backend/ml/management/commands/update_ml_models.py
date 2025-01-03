from django.core.management.base import BaseCommand
from ml.model_manager import ModelManager
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Downloads or updates ML models from S3'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force download even if models exist locally',
        )
        
    def handle(self, *args, **options):
        try:
            manager = ModelManager()
            models_to_update = [
                ('crop_disease', 'v1.0'),
                # Add other models here as needed
            ]
            
            for model_name, version in models_to_update:
                self.stdout.write(
                    self.style.NOTICE(f"Checking model: {model_name}")
                )
                
                if options['force']:
                    model_path = manager.download_model(model_name, version)
                    if model_path:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Successfully downloaded {model_name} version {version}"
                            )
                        )
                    else:
                        self.stdout.write(
                            self.style.ERROR(
                                f"Failed to download {model_name}"
                            )
                        )
                else:
                    if manager.check_for_updates(model_name, version):
                        model_path = manager.download_model(model_name, version)
                        if model_path:
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"Updated {model_name} to version {version}"
                                )
                            )
                        else:
                            self.stdout.write(
                                self.style.ERROR(
                                    f"Failed to update {model_name}"
                                )
                            )
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Model {model_name} is up to date"
                            )
                        )
                        
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"Error updating models: {str(e)}")
            )
