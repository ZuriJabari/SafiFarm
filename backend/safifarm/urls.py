"""
URL configuration for safifarm project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse

@api_view(['GET'])
def api_root(request, format=None):
    """
    Root endpoint showing all available API endpoints.
    """
    return Response({
        'admin': reverse('admin:index', request=request, format=format),
        'marketplace': {
            'equipment': reverse('equipment-list', request=request, format=format),
            'rentals': reverse('rental-list', request=request, format=format),
            'specialists': reverse('specialist-list', request=request, format=format),
            'consultations': reverse('consultation-list', request=request, format=format),
            'reviews': reverse('review-list', request=request, format=format),
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/marketplace/', include('marketplace.urls')),
    path('api/payments/', include('payment_processing.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
