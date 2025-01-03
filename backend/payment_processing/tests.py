from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from unittest.mock import patch, MagicMock
from datetime import timedelta
from decimal import Decimal

from .models import Transaction, PaymentMethod
from .providers import get_provider, PaymentProviderError
from .tasks import (
    check_pending_transactions,
    expire_old_transactions,
    retry_failed_transactions
)

User = get_user_model()

class PaymentMethodTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_payment_method_creation(self):
        payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='mtn',
            phone_number='+256700000000'
        )
        self.assertEqual(payment_method.provider, 'mtn')
        self.assertTrue(payment_method.is_active)
        
    def test_phone_number_validation(self):
        # Invalid Ugandan number
        with self.assertRaises(ValueError):
            PaymentMethod.objects.create(
                user=self.user,
                provider='mtn',
                phone_number='+254700000000'  # Kenyan number
            )

class TransactionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='mtn',
            phone_number='+256700000000'
        )
    
    def test_transaction_creation(self):
        transaction = Transaction.objects.create(
            user=self.user,
            payment_method=self.payment_method,
            amount=Decimal('50000'),  # 50,000 UGX
            transaction_type='rental'
        )
        self.assertEqual(transaction.status, 'pending')
        self.assertEqual(transaction.attempts, 0)
        self.assertIsNotNone(transaction.expires_at)
        
    def test_amount_validation(self):
        # Test minimum amount for rental
        with self.assertRaises(ValueError):
            Transaction.objects.create(
                user=self.user,
                payment_method=self.payment_method,
                amount=Decimal('5000'),  # Below minimum
                transaction_type='rental'
            )
        
        # Test maximum amount for rental
        with self.assertRaises(ValueError):
            Transaction.objects.create(
                user=self.user,
                payment_method=self.payment_method,
                amount=Decimal('11000000'),  # Above maximum
                transaction_type='rental'
            )
    
    def test_increment_attempts(self):
        transaction = Transaction.objects.create(
            user=self.user,
            payment_method=self.payment_method,
            amount=Decimal('50000'),
            transaction_type='rental'
        )
        
        transaction.increment_attempts('Test error')
        self.assertEqual(transaction.attempts, 1)
        self.assertEqual(transaction.last_error, 'Test error')

@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class PaymentTasksTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.payment_method = PaymentMethod.objects.create(
            user=self.user,
            provider='mtn',
            phone_number='+256700000000'
        )
        
    @patch('payment_processing.tasks.get_provider')
    def test_check_pending_transactions(self, mock_get_provider):
        # Create a pending transaction
        transaction = Transaction.objects.create(
            user=self.user,
            payment_method=self.payment_method,
            amount=Decimal('50000'),
            transaction_type='rental'
        )
        
        # Mock the provider's verify_payment method
        mock_provider = MagicMock()
        mock_provider.verify_payment.return_value = {
            'status': 'completed',
            'provider_status': 'SUCCESS'
        }
        mock_get_provider.return_value = mock_provider
        
        # Run the task
        check_pending_transactions()
        
        # Refresh transaction from db
        transaction.refresh_from_db()
        self.assertEqual(transaction.status, 'completed')
        self.assertIsNotNone(transaction.completed_at)
    
    def test_expire_old_transactions(self):
        # Create an expired transaction
        transaction = Transaction.objects.create(
            user=self.user,
            payment_method=self.payment_method,
            amount=Decimal('50000'),
            transaction_type='rental'
        )
        # Set expires_at to a past time
        transaction.expires_at = timezone.now() - timedelta(minutes=1)
        transaction.save()
        
        # Run the task
        expire_old_transactions()
        
        # Refresh transaction from db
        transaction.refresh_from_db()
        self.assertEqual(transaction.status, 'expired')
    
    @patch('payment_processing.tasks.get_provider')
    def test_retry_failed_transactions(self, mock_get_provider):
        # Create a failed transaction
        transaction = Transaction.objects.create(
            user=self.user,
            payment_method=self.payment_method,
            amount=Decimal('50000'),
            transaction_type='rental',
            status='failed',
            attempts=1
        )
        
        # Mock the provider's initiate_payment method
        mock_provider = MagicMock()
        mock_provider.initiate_payment.return_value = {
            'provider_ref': 'TEST123',
            'status': 'pending'
        }
        mock_get_provider.return_value = mock_provider
        
        # Run the task
        retry_failed_transactions()
        
        # Refresh transaction from db
        transaction.refresh_from_db()
        self.assertEqual(transaction.status, 'pending')
        self.assertEqual(transaction.attempts, 2)
        self.assertEqual(transaction.provider_ref, 'TEST123')
