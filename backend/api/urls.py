from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    PaymentViewSet, DiseaseViewSet, CropAnalysisViewSet, UserViewSet,
    SpecializationViewSet, SpecialistProfileViewSet, BookingViewSet, ReviewViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'diseases', DiseaseViewSet)
router.register(r'crop-analysis', CropAnalysisViewSet)
router.register(r'specializations', SpecializationViewSet)
router.register(r'specialist-profiles', SpecialistProfileViewSet, basename='specialist-profile')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] 