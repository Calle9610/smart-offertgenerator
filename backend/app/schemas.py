from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# Enums for validation
class RoomType(str, Enum):
    """Valid room types for project requirements."""

    BATHROOM = "bathroom"
    KITCHEN = "kitchen"
    FLOORING = "flooring"


class FinishLevel(str, Enum):
    """Valid finish levels for project requirements."""

    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data for JWT authentication."""

    username: Optional[str] = None
    tenant_id: Optional[UUID] = None


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
    source_items: Optional[List[Dict[str, Any]]] = (
        None  # Original auto-generated items for comparison
    )


class QuoteOutTotals(BaseModel):
    subtotal: float
    vat: float
    total: float


# Quote Package schemas
class QuotePackageItem(BaseModel):
    """Schema for items within a quote package."""
    
    kind: str = Field(..., description="Item type: labor, material, or custom")
    ref: Optional[str] = Field(None, description="Item reference code")
    description: Optional[str] = Field(None, description="Item description")
    qty: Decimal = Field(..., description="Quantity")
    unit: str = Field(..., description="Unit of measurement")
    unit_price: Decimal = Field(..., description="Unit price")
    line_total: Decimal = Field(..., description="Line total")


class QuotePackageCreate(BaseModel):
    """Schema for creating a quote package."""
    
    name: str = Field(..., description="Package name (e.g., Basic, Standard, Premium)")
    items: List[QuotePackageItem] = Field(..., description="List of package items")
    subtotal: Optional[Decimal] = Field(None, description="Package subtotal")
    vat: Optional[Decimal] = Field(None, description="Package VAT amount")
    total: Optional[Decimal] = Field(None, description="Package total amount")
    is_default: bool = Field(False, description="Whether this is the default package")


class QuotePackageOut(BaseModel):
    """Schema for quote package output."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    quote_id: UUID
    name: str
    items: List[QuotePackageItem]
    subtotal: Optional[Decimal]
    vat: Optional[Decimal]
    total: Optional[Decimal]
    is_default: bool
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class QuotePackageGenerateRequest(BaseModel):
    """Schema for generating quote packages."""
    
    package_names: List[str] = Field(
        default=["Basic", "Standard", "Premium"],
        description="Names of packages to generate"
    )
    discount_percentages: Optional[List[Decimal]] = Field(
        None,
        description="Discount percentages for each package (e.g., [0, 5, 10] for 0%, 5%, 10% off)"
    )


class QuotePackageAcceptRequest(BaseModel):
    """Schema for accepting a quote package."""
    
    packageId: UUID = Field(..., description="ID of the package to accept")


# Quote Adjustment Log schemas
class QuoteAdjustmentLogOut(BaseModel):
    """
    Output schema for quote adjustment logs.

    Shows what quantities were changed from auto-generated values.
    """

    id: UUID
    quote_id: UUID
    item_ref: str
    old_qty: Decimal
    new_qty: Decimal
    reason: Optional[str] = None
    created_at: str


class QuoteAdjustmentLogCreate(BaseModel):
    """
    Schema for creating new adjustment log entries.

    Used internally for logging quantity changes.
    """

    quote_id: UUID
    item_ref: str
    old_qty: Decimal
    new_qty: Decimal
    reason: Optional[str] = None


class ProjectRequirementsIn(BaseModel):
    """
    Input schema for project requirements during quote intake.

    Captures essential project details needed for quote generation.
    All fields are validated and sanitized for security.
    """

    room_type: RoomType = Field(..., description="Type of room being renovated")
    area: Decimal = Field(..., description="Room area in square meters")
    finish_level: FinishLevel = Field(..., description="Desired finish quality level")
    work_requirements: List[str] = Field(
        default_factory=list,
        description="List of specific work requirements",
    )
    special_requests: Optional[str] = Field(
        None, description="Any special requests or notes"
    )

    @field_validator("area")
    @classmethod
    def validate_area(cls, v):
        """Validate that area is positive and reasonable."""
        if v <= 0:
            raise ValueError("Area must be positive")
        if v > 1000:  # 1000 m² max for safety
            raise ValueError("Area seems unreasonably large")
        return v

    @field_validator("work_requirements")
    @classmethod
    def validate_work_requirements(cls, v):
        """Validate work requirements list."""
        if not v:
            raise ValueError("At least one work requirement must be specified")
        if len(v) > 20:  # Prevent abuse
            raise ValueError("Too many work requirements")
        return v


class ProjectRequirementsOut(BaseModel):
    """
    Output schema for project requirements.

    Includes generated ID and creation timestamp.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    quote_id: Optional[UUID] = None
    data: ProjectRequirementsIn
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class ProjectRequirementsCreate(BaseModel):
    """
    Internal schema for creating project requirements.

    Includes company_id for multi-tenant security.
    """

    company_id: UUID
    data: ProjectRequirementsIn


class GenerationRuleIn(BaseModel):
    """
    Input schema for generation rules.

    Rules define how to calculate quantities and prices
    based on project requirements.
    """

    key: str = Field(..., description="Rule key in format 'roomType|finishLevel'")
    rules: Dict[str, Any] = Field(..., description="Rule configuration as JSON")

    @field_validator("key")
    @classmethod
    def validate_key_format(cls, v):
        """Validate key format."""
        if "|" not in v:
            raise ValueError("Key must be in format 'roomType|finishLevel'")
        room_type, finish_level = v.split("|", 1)
        if not room_type or not finish_level:
            raise ValueError("Both roomType and finishLevel must be specified")
        return v


class GenerationRuleOut(BaseModel):
    """
    Output schema for generation rules.

    Includes generated ID and timestamps.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    key: str
    rules: Dict[str, Any]
    created_at: str
    updated_at: str

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class GenerationRuleCreate(BaseModel):
    """
    Internal schema for creating generation rules.

    Includes company_id for multi-tenant security.
    """

    company_id: UUID
    data: GenerationRuleIn


class UserCreate(BaseModel):
    """Schema for creating new users."""

    email: str = Field(..., description="User email address")
    username: str = Field(..., description="Username for login")
    password: str = Field(..., description="Plain text password (will be hashed)")
    full_name: Optional[str] = Field(None, description="User's full name")
    tenant_id: UUID = Field(..., description="Tenant ID for multi-tenancy")
    is_active: bool = Field(True, description="Whether user account is active")


class UserOut(BaseModel):
    """Schema for user output (no sensitive data)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    tenant_id: UUID
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class UserLogin(BaseModel):
    """Schema for user login."""

    username: str = Field(..., description="Username for login")
    password: str = Field(..., description="Plain text password")


class TenantCreate(BaseModel):
    """Schema for creating new tenants."""

    name: str = Field(..., description="Tenant name")
    domain: Optional[str] = Field(None, description="Tenant domain")


class TenantOut(BaseModel):
    """Schema for tenant output."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    domain: Optional[str]
    is_active: bool
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class CompanyCreate(BaseModel):
    """Schema for creating new companies."""

    name: str = Field(..., description="Company name")
    tenant_id: UUID = Field(..., description="Tenant ID for multi-tenancy")


class Company(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    tenant_id: UUID


class PriceProfileCreate(BaseModel):
    """Schema for creating new price profiles."""

    company_id: UUID = Field(..., description="Company ID for the price profile")
    name: str = Field(..., description="Profile name")
    currency: str = Field(..., description="Currency code")
    vat_rate: Decimal = Field(..., description="VAT rate percentage")


class QuoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_name: str
    project_name: Optional[str] = None
    company_id: UUID
    profile_id: UUID
    currency: str
    subtotal: Decimal
    vat: Decimal
    total: Decimal
    status: str
    public_token: str
    accepted_package_id: Optional[UUID] = None
    created_at: str
    updated_at: str

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class QuoteEventCreate(BaseModel):
    """Schema for creating quote events."""

    quote_id: UUID
    type: str = Field(..., description="Event type: sent, opened, accepted, declined")
    meta: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Additional metadata"
    )


class QuoteEventOut(BaseModel):
    """Schema for quote event output."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    quote_id: UUID
    type: str
    created_at: str
    meta: Dict[str, Any]

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class QuoteWithEvents(BaseModel):
    """Schema for quote with its events."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_name: str
    project_name: Optional[str] = None
    company_id: UUID
    profile_id: UUID
    currency: str
    subtotal: Decimal
    vat: Decimal
    total: Decimal
    status: str
    public_token: str
    accepted_package_id: Optional[UUID] = None
    created_at: str
    updated_at: str
    events: List[QuoteEventOut] = Field(default_factory=list)


class QuoteSendRequest(BaseModel):
    """Schema for sending a quote via email."""

    toEmail: str = Field(..., description="Customer email address")
    message: Optional[str] = Field(
        None, description="Optional custom message to include"
    )


class QuoteSendResponse(BaseModel):
    """Response schema for quote send operation."""

    sent: bool = Field(..., description="Whether the email was sent successfully")
    public_url: str = Field(..., description="Public URL for the quote")
    message: str = Field(..., description="Status message")


class PublicQuoteItem(BaseModel):
    """Public view of quote item for customers."""

    kind: str = Field(..., description="Item type: labor, material, or custom")
    description: Optional[str] = Field(None, description="Item description")
    qty: Decimal = Field(..., description="Quantity")
    unit: str = Field(..., description="Unit of measurement")
    unit_price: Decimal = Field(..., description="Unit price")
    line_total: Decimal = Field(..., description="Line total")


class PublicQuotePackage(BaseModel):
    """Public view of quote package for customers."""
    
    id: UUID = Field(..., description="Package ID")
    name: str = Field(..., description="Package name")
    items: List[PublicQuoteItem] = Field(..., description="Package items")
    subtotal: Decimal = Field(..., description="Package subtotal")
    vat: Decimal = Field(..., description="Package VAT amount")
    total: Decimal = Field(..., description="Package total amount")
    is_default: bool = Field(..., description="Whether this is the default package")


class PublicQuote(BaseModel):
    """Public view of quote for customers (no sensitive internal data)."""

    company_name: Optional[str] = Field(None, description="Company name")
    project_name: Optional[str] = Field(None, description="Project name")
    customer_name: str = Field(..., description="Customer name (may be masked)")
    currency: str = Field(..., description="Currency")
    items: List[PublicQuoteItem] = Field(..., description="Quote items")
    subtotal: Decimal = Field(..., description="Subtotal")
    vat: Decimal = Field(..., description="VAT amount")
    total: Decimal = Field(..., description="Total amount")
    packages: List[PublicQuotePackage] = Field(default_factory=list, description="Available packages")
    accepted_package_id: Optional[UUID] = Field(None, description="ID of accepted package if any")
    summary: Optional[str] = Field(None, description="Project summary")
    assumptions: Optional[str] = Field(None, description="Project assumptions")
    exclusions: Optional[str] = Field(None, description="What's not included")
    timeline: Optional[str] = Field(None, description="Project timeline")
    created_at: str = Field(..., description="Quote creation date")


# Auto-generation schemas
class AutoGeneratedItem(BaseModel):
    """Schema for auto-generated quote items."""
    
    kind: str = Field(..., description="Item type: labor, material, or custom")
    ref: Optional[str] = Field(None, description="Reference code (e.g., SNICK, VVS)")
    description: Optional[str] = Field(None, description="Item description")
    qty: Decimal = Field(..., description="Calculated quantity")
    unit: str = Field(..., description="Unit of measurement")
    unit_price: Decimal = Field(..., description="Unit price from price list")
    line_total: Decimal = Field(..., description="Line total (qty * unit_price)")
    confidence_per_item: Decimal = Field(..., description="Confidence level for this item (0.0-1.0)")


class AutoGenerateRequest(BaseModel):
    """Request schema for auto-generating quote items."""
    
    requirements_id: str = Field(..., description="ID of project requirements to use")
    profile_id: str = Field(..., description="ID of price profile to use")


class AutoGenerateResponse(BaseModel):
    """Response schema for auto-generated quotes."""
    
    items: List[AutoGeneratedItem] = Field(..., description="Generated quote items")
    subtotal: Decimal = Field(..., description="Subtotal of all items")
    vat: Decimal = Field(..., description="VAT amount")
    total: Decimal = Field(..., description="Total amount including VAT")
    confidence_per_item: List[Decimal] = Field(..., description="Confidence levels for each item")
