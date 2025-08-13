from sqlalchemy import Column, String, Numeric, TIMESTAMP, text, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from .db import Base

class Tenant(Base):
    __tablename__ = "tenant"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    domain = Column(String, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

class User(Base):
    __tablename__ = "user"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"), nullable=False)
    email = Column(String, nullable=False, unique=True)
    username = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    quotes = relationship("Quote", back_populates="user")

class Company(Base):
    __tablename__ = "company"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"), nullable=False)
    name = Column(String, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="companies")
    price_profiles = relationship("PriceProfile", back_populates="company")
    labor_rates = relationship("LaborRate", back_populates="company")
    materials = relationship("Material", back_populates="company")
    quotes = relationship("Quote", back_populates="company")
    project_requirements = relationship("ProjectRequirements", back_populates="company")
    generation_rules = relationship("GenerationRule", back_populates="company")

class PriceProfile(Base):
    __tablename__ = "price_profile"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    name = Column(String, nullable=False)
    currency = Column(String, nullable=False, default="SEK")
    vat_rate = Column(Numeric(5,2), nullable=False, default=25.00)
    
    # Relationships
    company = relationship("Company", back_populates="price_profiles")
    labor_rates = relationship("LaborRate", back_populates="profile")
    materials = relationship("Material", back_populates="profile")
    quotes = relationship("Quote", back_populates="profile")

class LaborRate(Base):
    __tablename__ = "labor_rate"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("price_profile.id"))
    code = Column(String, nullable=False)
    description = Column(String)
    unit = Column(String, nullable=False, default="hour")
    unit_price = Column(Numeric(12,2), nullable=False)
    
    # Relationships
    company = relationship("Company", back_populates="labor_rates")
    profile = relationship("PriceProfile", back_populates="labor_rates")

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
    
    # Relationships
    company = relationship("Company", back_populates="materials")
    profile = relationship("PriceProfile", back_populates="materials")

class Quote(Base):
    __tablename__ = "quote"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    customer_name = Column(String, nullable=False)
    project_name = Column(String)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("price_profile.id"), nullable=False)
    currency = Column(String, nullable=False, default="SEK")
    subtotal = Column(Numeric(12,2), server_default=text("0"))
    vat = Column(Numeric(12,2), server_default=text("0"))
    total = Column(Numeric(12,2), server_default=text("0"))
    status = Column(String, nullable=False, server_default=text("'draft'"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    
    # Relationships
    tenant = relationship("Tenant")
    company = relationship("Company", back_populates="quotes")
    user = relationship("User", back_populates="quotes")
    profile = relationship("PriceProfile", back_populates="quotes")
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan")
    project_requirements = relationship("ProjectRequirements", back_populates="quote")
    adjustment_logs = relationship("QuoteAdjustmentLog", back_populates="quote", cascade="all, delete-orphan")

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
    
    # Relationships
    quote = relationship("Quote", back_populates="items")

class ProjectRequirements(Base):
    """
    Project requirements for quote intake.
    
    Stores detailed project specifications including room type, area, finish level,
    and specific work requirements. All queries are scoped by company_id for
    multi-tenant security.
    """
    __tablename__ = "project_requirements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quote.id"), nullable=True)
    data = Column(JSONB, nullable=False)  # JSONB for flexible schema storage
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    
    # Relationships
    company = relationship("Company", back_populates="project_requirements")
    quote = relationship("Quote", back_populates="project_requirements")

class GenerationRule(Base):
    """
    Generation rules for auto-generating quote items.
    
    Stores rules for automatically calculating quantities and prices based on
    project requirements. Rules are scoped by company_id for multi-tenant security.
    Key format: "<roomType>|<finishLevel>" (e.g., "bathroom|standard")
    """
    __tablename__ = "generation_rule"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    key = Column(Text, nullable=False)  # Format: "roomType|finishLevel"
    rules = Column(JSONB, nullable=False)  # JSONB for flexible rule storage
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()"))
    
    # Relationships
    company = relationship("Company", back_populates="generation_rules")

# Add back-references for relationships
Tenant.users = relationship("User", back_populates="tenant")
Tenant.companies = relationship("Company", back_populates="tenant")

class QuoteAdjustmentLog(Base):
    """
    Log of quantity adjustments made to quote items.
    
    Tracks when users modify quantities from auto-generated values,
    providing audit trail for changes made before saving quotes.
    """
    __tablename__ = "quote_adjustment_log"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quote.id"), nullable=False)
    item_ref = Column(Text, nullable=False)  # Reference to the item (e.g., "SNICK", "VVS")
    old_qty = Column(Numeric(12,2), nullable=False)  # Original quantity from auto-generation
    new_qty = Column(Numeric(12,2), nullable=False)  # New quantity after user adjustment
    reason = Column(Text, nullable=True)  # Optional reason for the change
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    
    # Relationships
    quote = relationship("Quote", back_populates="adjustment_logs")
