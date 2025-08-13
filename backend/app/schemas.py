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

    Validates project specifications including room type, area, finish level,
    and specific work requirements. All fields are validated for safety.
    """

    room_type: RoomType = Field(..., description="Type of room for the project")
    area_m2: float = Field(
        ..., gt=0, description="Area in square meters, must be positive"
    )
    finish_level: FinishLevel = Field(
        ..., description="Desired finish level for the project"
    )
    has_plumbing_work: bool = Field(
        ..., description="Whether plumbing work is required"
    )
    has_electrical_work: bool = Field(
        ..., description="Whether electrical work is required"
    )
    material_prefs: List[str] = Field(
        default_factory=list, description="Material preferences"
    )
    site_constraints: List[str] = Field(
        default_factory=list, description="Site-specific constraints"
    )
    notes: Optional[str] = Field(None, description="Additional notes or requirements")

    @field_validator("area_m2")
    @classmethod
    def validate_area(cls, v):
        """Ensure area is reasonable for construction projects."""
        if v > 10000:  # 10,000 m² limit
            raise ValueError("Area cannot exceed 10,000 m²")
        return v

    @field_validator("material_prefs", "site_constraints")
    @classmethod
    def validate_list_lengths(cls, v):
        """Ensure lists don't exceed reasonable limits."""
        if len(v) > 50:  # 50 items limit
            raise ValueError("List cannot exceed 50 items")
        return v

    @field_validator("notes")
    @classmethod
    def validate_notes_length(cls, v):
        """Ensure notes don't exceed reasonable length."""
        if v and len(v) > 2000:  # 2000 characters limit
            raise ValueError("Notes cannot exceed 2000 characters")
        return v


class ProjectRequirementsOut(BaseModel):
    """
    Output schema for project requirements.

    Includes the ID and creation timestamp along with the requirements data.
    """

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    quote_id: Optional[UUID]
    data: ProjectRequirementsIn
    created_at: datetime

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class ProjectRequirementsCreate(BaseModel):
    """
    Schema for creating new project requirements.

    Used internally for database operations.
    """

    company_id: UUID
    quote_id: Optional[UUID] = None
    data: ProjectRequirementsIn


# Generation Rules schemas
class GenerationRuleIn(BaseModel):
    """
    Input schema for generation rules.

    Rules define how to automatically generate quote items based on project requirements.
    """

    key: str = Field(..., description="Rule key in format 'roomType|finishLevel'")
    rules: Dict[str, Dict[str, str]] = Field(
        ..., description="Generation rules for labor and materials"
    )

    @field_validator("key")
    @classmethod
    def validate_key_format(cls, v):
        """Validate key format is 'roomType|finishLevel'."""
        if "|" not in v:
            raise ValueError("Key must be in format 'roomType|finishLevel'")

        parts = v.split("|")
        if len(parts) != 2:
            raise ValueError("Key must contain exactly one '|' separator")

        room_type, finish_level = parts

        # Validate room type
        try:
            RoomType(room_type)
        except ValueError:
            raise ValueError(f"Invalid room type: {room_type}")

        # Validate finish level
        try:
            FinishLevel(finish_level)
        except ValueError:
            raise ValueError(f"Invalid finish level: {finish_level}")

        return v

    @field_validator("rules")
    @classmethod
    def validate_rules_structure(cls, v):
        """Validate rules structure contains labor and/or materials."""
        if not isinstance(v, dict):
            raise ValueError("Rules must be a dictionary")

        if not v:
            raise ValueError("Rules cannot be empty")

        allowed_sections = {"labor", "materials"}
        if not any(section in allowed_sections for section in v.keys()):
            raise ValueError("Rules must contain at least one of: labor, materials")

        for section, section_rules in v.items():
            if section not in allowed_sections:
                raise ValueError(
                    f"Unknown section: {section}. Allowed: {allowed_sections}"
                )

            if not isinstance(section_rules, dict):
                raise ValueError(f"Section {section} rules must be a dictionary")

            if not section_rules:
                raise ValueError(f"Section {section} rules cannot be empty")

        return v


class GenerationRuleOut(BaseModel):
    """
    Output schema for generation rules.

    Includes the ID and creation timestamp along with the rule data.
    """

    id: UUID
    company_id: UUID
    key: str
    rules: Dict[str, Dict[str, str]]
    created_at: str
    updated_at: str


class GenerationRuleCreate(BaseModel):
    """
    Schema for creating new generation rules.

    Used internally for database operations.
    """

    company_id: UUID
    key: str
    rules: Dict[str, Dict[str, str]]


# Auto-generation schemas
class AutoGenerateRequest(BaseModel):
    """
    Request schema for auto-generating quote items.
    """

    requirements_id: str = Field(..., description="ID of project requirements to use")
    profile_id: str = Field(..., description="ID of price profile to use")


class AutoGeneratedItem(BaseModel):
    """
    Schema for auto-generated quote items.
    """

    kind: str = Field(..., description="Item type: labor, material, or custom")
    ref: Optional[str] = Field(None, description="Reference code (e.g., SNICK, VVS)")
    description: Optional[str] = Field(None, description="Item description")
    qty: float = Field(..., description="Calculated quantity")
    unit: str = Field(..., description="Unit of measurement")
    unit_price: float = Field(..., description="Unit price from price list")
    line_total: float = Field(..., description="Line total (qty * unit_price)")
    confidence_per_item: float = Field(
        ..., description="Confidence level for this item (0.0-1.0)"
    )


class AutoGenerateResponse(BaseModel):
    """
    Response schema for auto-generated quotes.
    """

    items: List[AutoGeneratedItem] = Field(..., description="Generated quote items")
    subtotal: float = Field(..., description="Subtotal of all items")
    vat: float = Field(..., description="VAT amount")
    total: float = Field(..., description="Total amount including VAT")
    confidence_per_item: List[float] = Field(
        ..., description="Confidence levels for each item"
    )


class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    tenant_id: UUID
    is_active: bool = True


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    username: str
    full_name: Optional[str] = None
    tenant_id: UUID
    is_active: bool
    is_superuser: bool
    created_at: datetime

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class TenantCreate(BaseModel):
    name: str
    domain: Optional[str] = None


class Tenant(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    domain: Optional[str] = None
    is_active: bool
    created_at: datetime

    @field_validator("created_at", mode="before")
    @classmethod
    def convert_datetime(cls, v):
        """Convert datetime to ISO format string."""
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class CompanyCreate(BaseModel):
    name: str
    tenant_id: UUID


class Company(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    tenant_id: UUID


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
    created_at: str
    updated_at: str


class QuoteEventCreate(BaseModel):
    """Schema for creating quote events."""
    
    quote_id: UUID
    type: str = Field(..., description="Event type: sent, opened, accepted, declined")
    meta: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


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
    created_at: str
    updated_at: str
    events: List[QuoteEventOut] = Field(default_factory=list)


class QuoteSendRequest(BaseModel):
    """Schema for sending a quote via email."""
    
    toEmail: str = Field(..., description="Customer email address")
    message: Optional[str] = Field(None, description="Optional custom message to include")


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
    summary: Optional[str] = Field(None, description="Project summary")
    assumptions: Optional[str] = Field(None, description="Project assumptions")
    exclusions: Optional[str] = Field(None, description="What's not included")
    timeline: Optional[str] = Field(None, description="Project timeline")
    created_at: str = Field(..., description="Quote creation date")
