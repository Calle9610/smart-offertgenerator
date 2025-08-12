from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal

class QuoteItemIn(BaseModel):
    kind: str
    ref: Optional[str] = None
    description: Optional[str] = None
    qty: Decimal
    unit: Optional[str] = None
    unit_price: Decimal

class QuoteIn(BaseModel):
    customer_name: str
    project_name: Optional[str] = None
    profile_id: str
    currency: str = "SEK"
    vat_rate: Decimal = Decimal("25.0")
    items: List[QuoteItemIn]

class QuoteOutTotals(BaseModel):
    subtotal: Decimal
    vat: Decimal
    total: Decimal
