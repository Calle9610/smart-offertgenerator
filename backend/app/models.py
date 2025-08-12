from sqlalchemy import Column, String, Numeric, TIMESTAMP, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from .db import Base

class Company(Base):
    __tablename__ = "company"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)

class PriceProfile(Base):
    __tablename__ = "price_profile"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    name = Column(String, nullable=False)
    currency = Column(String, nullable=False, default="SEK")
    vat_rate = Column(Numeric(5,2), nullable=False, default=25.00)

class LaborRate(Base):
    __tablename__ = "labor_rate"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("price_profile.id"))
    code = Column(String, nullable=False)
    description = Column(String)
    unit = Column(String, nullable=False, default="hour")
    unit_price = Column(Numeric(12,2), nullable=False)

class Material(Base):
    __tablename__ = "material"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("price_profile.id"))
    sku = Column(String)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False, default="pcs")
    unit_cost = Column(Numeric(12,2), nullable=False)
    markup_pct = Column(Numeric(6,2), nullable=False, default=20.00)

class Quote(Base):
    __tablename__ = "quote"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    project_name = Column(String)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("price_profile.id"), nullable=False)
    currency = Column(String, nullable=False, default="SEK")
    subtotal = Column(Numeric(12,2), server_default=text("0"))
    vat = Column(Numeric(12,2), server_default=text("0"))
    total = Column(Numeric(12,2), server_default=text("0"))
    status = Column(String, nullable=False, server_default=text("'draft'"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

class QuoteItem(Base):
    __tablename__ = "quote_item"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quote.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String, nullable=False)  # labor | material | custom
    ref = Column(String)
    description = Column(String)
    qty = Column(Numeric(12,2), nullable=False)
    unit = Column(String)
    unit_price = Column(Numeric(12,2), nullable=False)
    line_total = Column(Numeric(12,2), nullable=False)
