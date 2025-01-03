from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'payment-methods', views.PaymentMethodViewSet, basename='payment-method')
router.register(r'transactions', views.TransactionViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
    path('initiate-payment/', views.InitiatePaymentView.as_view(), name='initiate-payment'),
    path('webhook/<str:provider>/', views.PaymentWebhookView.as_view(), name='payment-webhook'),
]
