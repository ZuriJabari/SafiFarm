from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'equipment', views.EquipmentViewSet, basename='equipment')
router.register(r'rentals', views.RentalViewSet, basename='rental')
router.register(r'specialists', views.SpecialistViewSet, basename='specialist')
router.register(r'consultations', views.ConsultationViewSet, basename='consultation')
router.register(r'reviews', views.ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]
