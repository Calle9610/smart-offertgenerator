import secrets
from decimal import Decimal
from typing import List, Optional, Dict
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from . import models
from . import schemas


# User operations
def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user."""
    from .auth import get_password_hash

    db_user = models.User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        tenant_id=user.tenant_id,
        is_active=user.is_active,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_username(db: Session, username: str) -> models.User:
    """Get user by username."""
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str) -> models.User:
    """Get user by email."""
    return db.query(models.User).filter(models.User.email == email).first()


# Tenant operations
def create_tenant(db: Session, tenant: schemas.TenantCreate) -> models.Tenant:
    """Create a new tenant."""
    db_tenant = models.Tenant(**tenant.dict())
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant


def get_tenant_by_domain(db: Session, domain: str) -> models.Tenant:
    """Get tenant by domain."""
    return db.query(models.Tenant).filter(models.Tenant.domain == domain).first()


# Company operations
def create_company(db: Session, company: schemas.CompanyCreate) -> models.Company:
    """Create a new company."""
    db_company = models.Company(**company.dict())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


def get_companies_by_tenant(db: Session, tenant_id: UUID) -> List[models.Company]:
    """Get all companies for a specific tenant."""
    return db.query(models.Company).filter(models.Company.tenant_id == tenant_id).all()


# Price Profile operations
def create_price_profile(db: Session, profile_data: dict) -> models.PriceProfile:
    """Create a new price profile."""
    db_profile = models.PriceProfile(**profile_data)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


# Quote operations
def create_quote(db: Session, tenant_id: UUID, user_id: UUID, data: dict) -> str:
    """Create a quote with tenant and user context."""
    # Generate unique public token for customer access
    public_token = secrets.token_hex(16)  # 32-character hex string

    q = models.Quote(
        tenant_id=tenant_id,
        company_id=data["company_id"],
        user_id=user_id,
        customer_name=data["customer_name"],
        project_name=data.get("project_name"),
        profile_id=data["profile_id"],
        currency=data.get("currency", "SEK"),
        subtotal=data["subtotal"],
        vat=data["vat"],
        total=data["total"],
        public_token=public_token,
    )
    db.add(q)
    db.flush()

    # Create quote items
    for item in data["items"]:
        qi = models.QuoteItem(
            quote_id=q.id,
            kind=item["kind"],
            ref=item.get("ref"),
            description=item.get("description"),
            qty=item["qty"],
            unit=item.get("unit"),
            unit_price=item["unit_price"],
            line_total=item["unit_price"] * item["qty"],
        )
        db.add(qi)

    db.commit()
    db.refresh(q)
    return str(q.id)


def get_quote_by_id_and_tenant(
    db: Session, quote_id: UUID, tenant_id: UUID
) -> Optional[models.Quote]:
    """
    Get quote by ID with tenant validation.

    Multi-tenant security: Only returns quotes belonging to the tenant.

    Args:
        db: Database session
        quote_id: Quote ID to retrieve
        tenant_id: Tenant ID for validation

    Returns:
        Quote instance if found and authorized, None otherwise
    """
    return (
        db.query(models.Quote)
        .filter(models.Quote.id == quote_id, models.Quote.tenant_id == tenant_id)
        .first()
    )


def get_quotes_by_tenant(db: Session, tenant_id: UUID) -> List[models.Quote]:
    """
    Get all quotes for a specific tenant.

    Multi-tenant security: Only returns quotes belonging to the tenant.

    Args:
        db: Database session
        tenant_id: Tenant ID to get quotes for

    Returns:
        List of Quote instances for the tenant
    """
    return (
        db.query(models.Quote)
        .filter(models.Quote.tenant_id == tenant_id)
        .order_by(models.Quote.created_at.desc())
        .all()
    )


def get_quote_by_public_token(db: Session, public_token: str) -> Optional[models.Quote]:
    """
    Get quote by public token (no tenant validation needed for public access).

    Args:
        db: Database session
        public_token: Public token to look up

    Returns:
        Quote instance if found, None otherwise
    """
    return (
        db.query(models.Quote)
        .filter(models.Quote.public_token == public_token)
        .first()
    )


def get_quote_with_events(db: Session, quote_id: UUID, tenant_id: UUID) -> Optional[models.Quote]:
    """
    Get quote with all its events, tenant-scoped.

    Multi-tenant security: Only returns quotes belonging to the tenant.

    Args:
        db: Database session
        quote_id: Quote ID to retrieve
        tenant_id: Tenant ID for validation

    Returns:
        Quote instance with events if found and authorized, None otherwise
    """
    return (
        db.query(models.Quote)
        .options(joinedload(models.Quote.events))
        .filter(models.Quote.id == quote_id, models.Quote.tenant_id == tenant_id)
        .first()
    )


# Quote Package operations
def create_quote_package(
    db: Session, quote_id: UUID, package_data: schemas.QuotePackageCreate
) -> models.QuotePackage:
    """Create a new quote package."""
    package = models.QuotePackage(
        quote_id=quote_id,
        name=package_data.name,
        items=package_data.items,
        subtotal=package_data.subtotal,
        vat=package_data.vat,
        total=package_data.total,
        is_default=package_data.is_default,
    )
    db.add(package)
    db.commit()
    db.refresh(package)
    return package


def get_quote_packages(db: Session, quote_id: UUID) -> List[models.QuotePackage]:
    """Get all packages for a specific quote."""
    return db.query(models.QuotePackage).filter(
        models.QuotePackage.quote_id == quote_id
    ).all()


def update_quote_accepted_package(
    db: Session, quote_id: UUID, package_id: UUID
) -> Optional[models.Quote]:
    """Update the accepted package for a quote."""
    quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
    if quote:
        quote.accepted_package_id = package_id
        db.commit()
        db.refresh(quote)
    return quote


def generate_quote_packages(
    db: Session, quote_id: UUID, tenant_id: UUID, package_names: List[str], discount_percentages: Optional[List[Decimal]] = None
) -> List[models.QuotePackage]:
    """Generate quote packages with different discount levels."""
    # Get the base quote and items
    quote = get_quote_by_id_and_tenant(db, quote_id, tenant_id)
    if not quote:
        return []

    # Get quote items
    items = db.query(models.QuoteItem).filter(models.QuoteItem.quote_id == quote_id).all()
    if not items:
        return []

    packages = []
    base_items = [
        {
            "kind": item.kind,
            "ref": item.ref,
            "description": item.description,
            "qty": item.qty,
            "unit": item.unit,
            "unit_price": item.unit_price,
            "line_total": item.line_total,
        }
        for item in items
    ]

    # Generate packages with different discount levels
    for i, package_name in enumerate(package_names):
        discount = discount_percentages[i] if discount_percentages and i < len(discount_percentages) else Decimal("0")
        discount_multiplier = Decimal("1") - (discount / Decimal("100"))

        package_items = []
        subtotal = Decimal("0")

        for item in base_items:
            adjusted_unit_price = item["unit_price"] * discount_multiplier
            adjusted_line_total = item["qty"] * adjusted_unit_price

            package_items.append({
                "kind": item["kind"],
                "ref": item["ref"],
                "description": item["description"],
                "qty": float(item["qty"]),
                "unit": item["unit"],
                "unit_price": float(adjusted_unit_price),
                "line_total": float(adjusted_line_total),
            })
            subtotal += adjusted_line_total

        vat = subtotal * (quote.vat / quote.subtotal) if quote.subtotal > 0 else Decimal("0")
        total = subtotal + vat

        package_data = schemas.QuotePackageCreate(
            name=package_name,
            items=package_items,
            subtotal=float(subtotal),
            vat=float(vat),
            total=float(total),
            is_default=(i == 0),
        )

        package = create_quote_package(db, quote_id, package_data)
        packages.append(package)

    return packages


# Quote Event operations
def create_quote_event(
    db: Session, event_data: schemas.QuoteEventCreate
) -> models.QuoteEvent:
    """
    Create new quote event.

    Args:
        db: Database session
        event_data: Event data from request

    Returns:
        Created QuoteEvent instance
    """
    db_event = models.QuoteEvent(**event_data.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def get_quote_events(
    db: Session, quote_id: UUID, tenant_id: UUID
) -> List[models.QuoteEvent]:
    """
    Get all events for a specific quote with tenant validation.

    Multi-tenant security: Only returns events for quotes belonging to the tenant.

    Args:
        db: Database session
        quote_id: Quote ID to get events for
        tenant_id: Tenant ID for validation

    Returns:
        List of QuoteEvent for the quote
    """
    # First verify the quote belongs to the tenant
    quote = (
        db.query(models.Quote)
        .filter(models.Quote.id == quote_id, models.Quote.tenant_id == tenant_id)
        .first()
    )

    if not quote:
        return []

    # Get events for this quote
    events = (
        db.query(models.QuoteEvent)
        .filter(models.QuoteEvent.quote_id == quote_id)
        .order_by(models.QuoteEvent.created_at.desc())
        .all()
    )

    return events


# Project Requirements operations
def create_project_requirements(
    db: Session, requirements: schemas.ProjectRequirementsCreate
) -> models.ProjectRequirements:
    """
    Create new project requirements.

    Args:
        db: Database session
        requirements: Requirements data from request

    Returns:
        Created ProjectRequirements instance
    """
    db_requirements = models.ProjectRequirements(**requirements.model_dump())
    db.add(db_requirements)
    db.commit()
    db.refresh(db_requirements)
    return db_requirements


def get_project_requirements_by_company(
    db: Session, company_id: UUID
) -> List[models.ProjectRequirements]:
    """
    Get all project requirements for a specific company.

    Multi-tenant security: Only returns requirements belonging to the company.

    Args:
        db: Database session
        company_id: Company ID to get requirements for

    Returns:
        List of ProjectRequirements for the company
    """
    return (
        db.query(models.ProjectRequirements)
        .filter(models.ProjectRequirements.company_id == company_id)
        .order_by(models.ProjectRequirements.created_at.desc())
        .all()
    )


def get_project_requirements_by_quote(
    db: Session, quote_id: UUID, company_id: UUID
) -> Optional[models.ProjectRequirements]:
    """
    Get project requirements for a specific quote with company validation.

    Multi-tenant security: Ensures the quote belongs to the specified company.

    Args:
        db: Database session
        quote_id: Quote ID to find requirements for
        company_id: Company ID for tenant scoping

    Returns:
        ProjectRequirements if found and belongs to company, None otherwise
    """
    return (
        db.query(models.ProjectRequirements)
        .filter(
            models.ProjectRequirements.quote_id == quote_id,
            models.ProjectRequirements.company_id == company_id,
        )
        .first()
    )


def get_project_requirements_by_id(
    db: Session, requirements_id: UUID, company_id: UUID
) -> Optional[models.ProjectRequirements]:
    """
    Get project requirements by ID with company validation.

    Multi-tenant security: Ensures the requirements belong to the specified company.

    Args:
        db: Database session
        requirements_id: Project requirements ID
        company_id: Company ID for tenant scoping

    Returns:
        ProjectRequirements if found and belongs to company, None otherwise
    """
    return (
        db.query(models.ProjectRequirements)
        .filter(
            models.ProjectRequirements.id == requirements_id,
            models.ProjectRequirements.company_id == company_id,
        )
        .first()
    )


def update_project_requirements(
    db: Session, requirements_id: UUID, company_id: UUID, update_data: dict
) -> Optional[models.ProjectRequirements]:
    """
    Update project requirements with company validation.

    Multi-tenant security: Only allows updates to requirements belonging to the company.

    Args:
        db: Database session
        requirements_id: Project requirements ID to update
        company_id: Company ID for tenant scoping
        update_data: Dictionary of fields to update

    Returns:
        Updated ProjectRequirements if found and belongs to company, None otherwise
    """
    requirements = get_project_requirements_by_id(db, requirements_id, company_id)
    if not requirements:
        return None

    # Update only allowed fields
    allowed_fields = {"data", "quote_id"}
    for field, value in update_data.items():
        if field in allowed_fields:
            setattr(requirements, field, value)

    db.commit()
    db.refresh(requirements)
    return requirements


def delete_project_requirements(
    db: Session, requirements_id: UUID, company_id: UUID
) -> bool:
    """
    Delete project requirements with company validation.

    Multi-tenant security: Only allows deletion of requirements belonging to the company.

    Args:
        db: Database session
        requirements_id: Project requirements ID to delete
        company_id: Company ID for tenant scoping

    Returns:
        True if deleted successfully, False if not found or not authorized
    """
    requirements = get_project_requirements_by_id(db, requirements_id, company_id)
    if not requirements:
        return False

    db.delete(requirements)
    db.commit()
    return True


# Generation Rule CRUD operations
def create_generation_rule(
    db: Session, company_id: UUID, key: str, rules: Dict
) -> models.GenerationRule:
    """Create a new generation rule for a company."""
    generation_rule = models.GenerationRule(
        company_id=company_id,
        key=key,
        rules=rules,
    )
    db.add(generation_rule)
    db.commit()
    db.refresh(generation_rule)
    return generation_rule


def get_generation_rule_by_key(
    db: Session, company_id: UUID, key: str
) -> Optional[models.GenerationRule]:
    """Get a generation rule by key for a specific company."""
    return db.query(models.GenerationRule).filter(
        models.GenerationRule.company_id == company_id,
        models.GenerationRule.key == key
    ).first()


def get_generation_rules_by_company(
    db: Session, company_id: UUID
) -> List[models.GenerationRule]:
    """Get all generation rules for a company."""
    return db.query(models.GenerationRule).filter(
        models.GenerationRule.company_id == company_id
    ).all()


def update_generation_rule(
    db: Session, rule_id: UUID, company_id: UUID, rules: Dict
) -> Optional[models.GenerationRule]:
    """Update a generation rule."""
    rule = db.query(models.GenerationRule).filter(
        models.GenerationRule.id == rule_id,
        models.GenerationRule.company_id == company_id
    ).first()
    
    if rule:
        rule.rules = rules
        db.commit()
        db.refresh(rule)
    
    return rule


def delete_generation_rule(
    db: Session, rule_id: UUID, company_id: UUID
) -> bool:
    """Delete a generation rule."""
    rule = db.query(models.GenerationRule).filter(
        models.GenerationRule.id == rule_id,
        models.GenerationRule.company_id == company_id
    ).first()
    
    if rule:
        db.delete(rule)
        db.commit()
        return True
    
    return False


# Quote Adjustment Log CRUD operations
def create_quote_adjustment_log(
    db: Session,
    quote_id: UUID,
    company_id: UUID,
    item_ref: str,
    old_qty: Decimal,
    new_qty: Decimal,
    reason: Optional[str] = None
) -> models.QuoteAdjustmentLog:
    """Create a new quote adjustment log entry."""
    adjustment_log = models.QuoteAdjustmentLog(
        quote_id=quote_id,
        company_id=company_id,
        item_ref=item_ref,
        old_qty=old_qty,
        new_qty=new_qty,
        reason=reason,
    )
    db.add(adjustment_log)
    db.commit()
    db.refresh(adjustment_log)
    return adjustment_log


def get_adjustment_logs_by_quote(
    db: Session, quote_id: UUID, company_id: UUID
) -> List[models.QuoteAdjustmentLog]:
    """Get all adjustment logs for a specific quote."""
    return db.query(models.QuoteAdjustmentLog).filter(
        models.QuoteAdjustmentLog.quote_id == quote_id,
        models.QuoteAdjustmentLog.company_id == company_id
    ).order_by(models.QuoteAdjustmentLog.created_at.desc()).all()


def get_adjustment_logs_by_company(
    db: Session, company_id: UUID, limit: int = 100
) -> List[models.QuoteAdjustmentLog]:
    """Get recent adjustment logs for a company."""
    return db.query(models.QuoteAdjustmentLog).filter(
        models.QuoteAdjustmentLog.company_id == company_id
    ).order_by(models.QuoteAdjustmentLog.created_at.desc()).limit(limit).all()


# Tuning Stats CRUD operations
def create_or_update_tuning_stat(
    db: Session,
    company_id: UUID,
    key: str,
    item_ref: str,
    median_factor: Decimal,
    n: int
) -> models.TuningStat:
    """Create or update a tuning statistic."""
    # Try to find existing stat
    stat = db.query(models.TuningStat).filter(
        models.TuningStat.company_id == company_id,
        models.TuningStat.key == key,
        models.TuningStat.item_ref == item_ref
    ).first()
    
    if stat:
        # Update existing stat
        stat.median_factor = median_factor
        stat.n = n
        stat.updated_at = func.now()
    else:
        # Create new stat
        stat = models.TuningStat(
            company_id=company_id,
            key=key,
            item_ref=item_ref,
            median_factor=median_factor,
            n=n,
        )
        db.add(stat)
    
    db.commit()
    db.refresh(stat)
    return stat


def get_tuning_stats_by_company(
    db: Session, company_id: UUID
) -> List[models.TuningStat]:
    """Get all tuning stats for a company."""
    return db.query(models.TuningStat).filter(
        models.TuningStat.company_id == company_id
    ).all()


def get_tuning_stat_by_key_and_item(
    db: Session, company_id: UUID, key: str, item_ref: str
) -> Optional[models.TuningStat]:
    """Get a specific tuning stat by key and item reference."""
    return db.query(models.TuningStat).filter(
        models.TuningStat.company_id == company_id,
        models.TuningStat.key == key,
        models.TuningStat.item_ref == item_ref
    ).first()


def delete_tuning_stat(
    db: Session, company_id: UUID, key: str, item_ref: str
) -> bool:
    """Delete a tuning statistic."""
    stat = db.query(models.TuningStat).filter(
        models.TuningStat.company_id == company_id,
        models.TuningStat.key == key,
        models.TuningStat.item_ref == item_ref
    ).first()
    
    if stat:
        db.delete(stat)
        db.commit()
        return True
    
    return False
