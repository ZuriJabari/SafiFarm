from decimal import Decimal, ROUND_DOWN
from typing import Union

class UgandaShillingValidator:
    """Validator for Uganda Shilling amounts."""
    
    @staticmethod
    def clean_amount(amount: Union[str, int, float, Decimal]) -> Decimal:
        """Convert amount to proper UGX format (whole numbers only)."""
        if isinstance(amount, str):
            # Remove any commas and spaces
            amount = amount.replace(',', '').replace(' ', '')
        
        try:
            # Convert to Decimal and round down to nearest whole number
            decimal_amount = Decimal(str(amount)).quantize(Decimal('1.'), rounding=ROUND_DOWN)
            if decimal_amount <= 0:
                raise ValueError("Amount must be greater than 0")
            return decimal_amount
        except (ValueError, TypeError, ArithmeticError) as e:
            raise ValueError(f"Invalid amount format: {str(e)}")

    @staticmethod
    def validate_min_amount(amount: Decimal, transaction_type: str) -> None:
        """Validate minimum amount based on transaction type."""
        min_amounts = {
            'rental': Decimal('10000'),  # Minimum 10,000 UGX for rentals
            'consultation': Decimal('20000'),  # Minimum 20,000 UGX for consultations
            'refund': Decimal('1000'),  # Minimum 1,000 UGX for refunds
        }
        
        min_amount = min_amounts.get(transaction_type)
        if min_amount and amount < min_amount:
            raise ValueError(
                f"Minimum amount for {transaction_type} is "
                f"{format_ugx(min_amount)} UGX"
            )

    @staticmethod
    def validate_max_amount(amount: Decimal, transaction_type: str) -> None:
        """Validate maximum amount based on transaction type."""
        max_amounts = {
            'rental': Decimal('10000000'),  # Maximum 10M UGX for rentals
            'consultation': Decimal('5000000'),  # Maximum 5M UGX for consultations
            'refund': Decimal('1000000'),  # Maximum 1M UGX for refunds
        }
        
        max_amount = max_amounts.get(transaction_type)
        if max_amount and amount > max_amount:
            raise ValueError(
                f"Maximum amount for {transaction_type} is "
                f"{format_ugx(max_amount)} UGX"
            )

def format_ugx(amount: Union[str, int, float, Decimal]) -> str:
    """Format amount in Uganda Shillings with proper grouping."""
    try:
        # Convert to Decimal and round to whole number
        amount_decimal = UgandaShillingValidator.clean_amount(amount)
        # Format with thousands separator
        formatted = "{:,.0f}".format(amount_decimal)
        return f"{formatted} UGX"
    except ValueError as e:
        raise ValueError(f"Invalid amount format: {str(e)}")

def validate_transaction_amount(
    amount: Union[str, int, float, Decimal],
    transaction_type: str
) -> Decimal:
    """Validate and clean transaction amount."""
    validator = UgandaShillingValidator()
    
    # Clean and convert amount
    cleaned_amount = validator.clean_amount(amount)
    
    # Validate minimum and maximum amounts
    validator.validate_min_amount(cleaned_amount, transaction_type)
    validator.validate_max_amount(cleaned_amount, transaction_type)
    
    return cleaned_amount
