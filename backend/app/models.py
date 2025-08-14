import uuid

from sqlalchemy import Column, String, Numeric, TIMESTAMP, text, ForeignKey, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import sqlalchemy as sa

from .db import Base


class Tenant(Base):
    __tablename__ = "tenant"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    domain = Column(String, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    # Relationships
    users = relationship("User", back_populates="tenant")
    companies = relationship("Company", back_populates="tenant")


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
    company = relationship("Company", back_populates="users")
    quotes = relationship("Quote", back_populates="user")
    adjustment_logs = relationship("QuoteAdjustmentLog", back_populates="user")


class Company(Base):
    __tablename__ = "company"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenant.id"), nullable=False)
    name = Column(String, nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="companies")
    users = relationship("User", back_populates="company")
    price_profiles = relationship("PriceProfile", back_populates="company")
    labor_rates = relationship("LaborRate", back_populates="company")
    materials = relationship("Material", back_populates="company")
    quotes = relationship("Quote", back_populates="company")
    project_requirements = relationship("ProjectRequirements", back_populates="company")
    generation_rules = relationship("GenerationRule", back_populates="company")
    quote_adjustment_logs = relationship("QuoteAdjustmentLog", back_populates="company")
    tuning_stats = relationship("TuningStat", back_populates="company")


class PriceProfile(Base):
    __tablename__ = "price_profile"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    name = Column(String, nullable=False)
    currency = Column(String, nullable=False, default="SEK")
    vat_rate = Column(Numeric(5, 2), nullable=False, default=25.00)

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
    unit_price = Column(Numeric(12, 2), nullable=False)

    # Relationships
    company = relationship("Company", back_populates="labor_rates")
    profile = relationship("PriceProfile", back_populates="labor_rates")


class Material(Base):
    __tablename__ = "material"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("price_profile.id"))
    sku = Column(String)
    name = Column(Text, nullable=False)
    unit = Column(String, nullable=False, default="pcs")
    unit_cost = Column(Numeric(12, 2), nullable=False)
    markup_pct = Column(Numeric(6, 2), nullable=False, default=20.00)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

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
    profile_id = Column(
        UUID(as_uuid=True), ForeignKey("price_profile.id"), nullable=False
    )
    currency = Column(String, nullable=False, default="SEK")
    subtotal = Column(Numeric(12, 2), server_default=text("0"))
    vat = Column(Numeric(12, 2), server_default=text("0"))
    total = Column(Numeric(12, 2), server_default=text("0"))
    status = Column(String, nullable=False, server_default=text("'draft'"))
    public_token = Column(String(64), unique=True, nullable=False)
    accepted_package_id = Column(UUID(as_uuid=True), ForeignKey("quote_package.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    updated_at = Column(
        TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()")
    )

    # Relationships
    tenant = relationship("Tenant")
    company = relationship("Company", back_populates="quotes")
    user = relationship("User", back_populates="quotes")
    profile = relationship("PriceProfile", back_populates="quotes")
    items = relationship(
        "QuoteItem", back_populates="quote", cascade="all, delete-orphan"
    )
    packages = relationship(
        "QuotePackage",
        foreign_keys="[QuotePackage.quote_id]",
        back_populates="quote",
        cascade="all, delete-orphan"
    )
    accepted_package = relationship("QuotePackage", foreign_keys=[accepted_package_id], post_update=True)
    project_requirements = relationship("ProjectRequirements", back_populates="quote")
    adjustment_logs = relationship(
        "QuoteAdjustmentLog", back_populates="quote", cascade="all, delete-orphan"
    )
    events = relationship(
        "QuoteEvent", back_populates="quote", cascade="all, delete-orphan"
    )


class QuoteItem(Base):
    __tablename__ = "quote_item"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(
        UUID(as_uuid=True), ForeignKey("quote.id", ondelete="CASCADE"), nullable=False
    )
    kind = Column(String, nullable=False)  # labor | material | custom
    ref = Column(String)
    description = Column(Text)
    qty = Column(Numeric(12, 2), nullable=False)
    unit = Column(String)
    unit_price = Column(Numeric(12, 2), nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    # Relationships
    quote = relationship("Quote", back_populates="items")


class QuotePackage(Base):
    """
    Quote packages for offering different service levels.

    Stores different package options for a quote, allowing customers to choose
    between basic, standard, and premium service levels. Each package contains
    a list of items with quantities and prices.
    """

    __tablename__ = "quote_package"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quote.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)  # e.g., "Basic", "Standard", "Premium"
    items = Column(JSONB, nullable=False)  # List of package items
    subtotal = Column(Numeric(12, 2), nullable=True)
    vat = Column(Numeric(12, 2), nullable=True)
    total = Column(Numeric(12, 2), nullable=True)
    is_default = Column(Boolean, server_default=text("false"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    # Relationships
    quote = relationship("Quote", foreign_keys=[quote_id], back_populates="packages")


class QuoteEvent(Base):
    """
    Quote events for tracking and analytics.

    Tracks various events like quote creation, sending, opening, acceptance, etc.
    All events are scoped by company_id for multi-tenant security.
    """

    __tablename__ = "quote_event"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quote.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    event_type = Column(String, nullable=False)  # sent, opened, accepted, declined
    meta = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    # Relationships
    quote = relationship("Quote", back_populates="events")
    company = relationship("Company")


class ProjectRequirements(Base):
    """
    Project requirements for quote intake.

    Stores detailed project specifications including room type, area, finish level,
    and specific work requirements. All queries are scoped by company_id for
    multi-tenant security.
    """

    __tablename__ = "project_requirements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quote.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id"), nullable=False)
    data = Column(JSONB, nullable=False)  # Room type, area, finish level, etc.
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()"))

    # Relationships
    quote = relationship("Quote", back_populates="project_requirements")
    company = relationship("Company", back_populates="project_requirements")


class GenerationRule(Base):
    """
    Generation rules for auto-generating quote items.

    Stores rules for automatically calculating quantities and prices based on
    project requirements. Rules are scoped by company_id for multi-tenant security.
    Key format: "<roomType>|<finishLevel>" (e.g., "bathroom|standard")
    """

    __tablename__ = "generation_rule"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id", ondelete="CASCADE"), nullable=False)
    key = Column(Text, nullable=False)  # Format: "roomType|finishLevel"
    rules = Column(JSONB, nullable=False)  # Generation rules configuration
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    # Relationships
    company = relationship("Company", back_populates="generation_rules")


class QuoteAdjustmentLog(Base):
    __tablename__ = "quote_adjustment_log"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quote.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id", ondelete="CASCADE"), nullable=False)
    item_ref = Column(Text, nullable=False)
    old_qty = Column(Numeric(12, 2), nullable=False)
    new_qty = Column(Numeric(12, 2), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))

    # Relationships
    quote = relationship("Quote", back_populates="adjustment_logs")
    company = relationship("Company", back_populates="quote_adjustment_logs")


class TuningStat(Base):
    __tablename__ = "tuning_stat"
    company_id = Column(UUID(as_uuid=True), ForeignKey("company.id", ondelete="CASCADE"), nullable=False)
    key = Column(Text, nullable=False)  # Format: "roomType|finishLevel"
    item_ref = Column(Text, nullable=False)
    median_factor = Column(Numeric(8, 3), nullable=False, server_default=text("1.000"))
    n = Column(Integer, nullable=False, server_default=text("0"))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"), onupdate=text("now()"))

    # Composite primary key
    __table_args__ = (
        sa.PrimaryKeyConstraint('company_id', 'key', 'item_ref'),
    )

    # Relationships
    company = relationship("Company", back_populates="tuning_stats")
