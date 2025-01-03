from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid
from ml.tasks import analyze_crop_image
from ..serializers import DiseaseDetectionSerializer
import logging

logger = logging.getLogger(__name__)

class DiseaseDetectionViewSet(viewsets.ViewSet):
    """
    ViewSet for crop disease detection functionality.
    """
    parser_classes = (MultiPartParser,)
    
    @action(detail=False, methods=['POST'])
    def detect(self, request):
        """
        Endpoint to handle crop disease detection requests.
        """
        try:
            serializer = DiseaseDetectionSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            image = request.FILES.get('image')
            if not image:
                return Response(
                    {'error': 'No image provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Generate unique filename
            ext = os.path.splitext(image.name)[1]
            filename = f"{uuid.uuid4()}{ext}"
            
            # Save image temporarily
            temp_path = os.path.join(settings.MEDIA_ROOT, 'temp', filename)
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            
            with default_storage.open(temp_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)
                    
            # Start async task for analysis
            task = analyze_crop_image.delay(temp_path)
            
            return Response({
                'task_id': task.id,
                'status': 'Processing',
                'message': 'Image analysis started'
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            logger.error(f"Error in disease detection endpoint: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['GET'])
    def result(self, request):
        """
        Endpoint to get the results of a disease detection task.
        """
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {'error': 'No task_id provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            task = analyze_crop_image.AsyncResult(task_id)
            
            if task.ready():
                result = task.get()
                return Response({
                    'status': 'Completed',
                    'results': result
                })
            else:
                return Response({
                    'status': 'Processing',
                    'message': 'Analysis still in progress'
                })
                
        except Exception as e:
            logger.error(f"Error fetching task result: {str(e)}")
            return Response(
                {'error': 'Error fetching results'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
