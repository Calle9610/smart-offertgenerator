from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from . import models
from .schemas import (
    CompanyCreate,
    GenerationRuleCreate,
    ProjectRequirementsCreate,
    QuoteAdjustmentLogCreate,
    TenantCreate,
    UserCreate,
)


# User operations
def create_user(db: Session, user: UserCreate) -> models.User:
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
def create_tenant(db: Session, tenant: TenantCreate) -> models.Tenant:
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
def create_company(db: Session, company: CompanyCreate) -> models.Company:
    """Create a new company."""
    db_company = models.Company(**company.dict())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


def get_companies_by_tenant(db: Session, tenant_id: UUID) -> List[models.Company]:
    """Get all companies for a specific tenant."""
    return db.query(models.Company).filter(models.Company.tenant_id == tenant_id).all()


# Quote operations
def create_quote(db: Session, tenant_id: UUID, user_id: UUID, data: dict) -> str:
    """Create a quote with tenant and user context."""
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
    )
    db.add(q)
    db.flush()

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


def get_quotes_by_tenant(db: Session, tenant_id: UUID) -> List[models.Quote]:
    """Get all quotes for a specific tenant."""
    return db.query(models.Quote).filter(models.Quote.tenant_id == tenant_id).all()


def get_quote_by_id_and_tenant(
    db: Session, quote_id: UUID, tenant_id: UUID
) -> Optional[models.Quote]:
    """Get a specific quote by ID, ensuring it belongs to the tenant."""
    return (
        db.query(models.Quote)
        .filter(models.Quote.id == quote_id, models.Quote.tenant_id == tenant_id)
        .first()
    )


# Project Requirements operations
def create_project_requirements(
    db: Session, requirements: ProjectRequirementsCreate
) -> models.ProjectRequirements:
    """
    Create new project requirements with multi-tenant security.

    Args:
        db: Database session
        requirements: Project requirements data with company_id for tenant scoping

    Returns:
        Created ProjectRequirements instance

    Raises:
        ValueError: If company_id is not provided
    """
    if not requirements.company_id:
        raise ValueError("company_id is required for multi-tenant security")

    db_requirements = models.ProjectRequirements(
        company_id=requirements.company_id,
        quote_id=requirements.quote_id,
        data=requirements.data.dict(),
    )
    db.add(db_requirements)
    db.commit()
    db.refresh(db_requirements)
    return db_requirements


def get_project_requirements_by_company(
    db: Session, company_id: UUID
) -> List[models.ProjectRequirements]:
    """
    Get all project requirements for a specific company.

    Multi-tenant security: Only returns requirements for the specified company_id.

    Args:
        db: Database session
        company_id: Company ID for tenant scoping

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


# Generation Rules operations
def create_generation_rule(
    db: Session, rule: GenerationRuleCreate
) -> models.GenerationRule:
    """
    Create new generation rule with multi-tenant security.

    Args:
        db: Database session
        rule: Generation rule data with company_id for tenant scoping

    Returns:
        Created GenerationRule instance

    Raises:
        ValueError: If company_id is not provided
    """
    if not rule.company_id:
        raise ValueError("company_id is required for multi-tenant security")

    db_rule = models.GenerationRule(
        company_id=rule.company_id, key=rule.key, rules=rule.rules
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def get_generation_rule_by_key(
    db: Session, company_id: UUID, key: str
) -> Optional[models.GenerationRule]:
    """
    Get generation rule by key with company validation.

    Multi-tenant security: Only returns rules belonging to the specified company.

    Args:
        db: Database session
        company_id: Company ID for tenant scoping
        key: Rule key in format 'roomType|finishLevel'

    Returns:
        GenerationRule if found and belongs to company, None otherwise
    """
    rule = (
        db.query(models.GenerationRule)
        .filter(
            models.GenerationRule.company_id == company_id,
            models.GenerationRule.key == key,
        )
        .first()
    )

    if rule:
        # Convert datetime objects to strings for Pydantic compatibility
        if hasattr(rule, "created_at") and rule.created_at:
            rule.created_at = rule.created_at.isoformat()
        if hasattr(rule, "updated_at") and rule.updated_at:
            rule.updated_at = rule.updated_at.isoformat()

    return rule


def get_generation_rules_by_company(
    db: Session, company_id: UUID
) -> List[models.GenerationRule]:
    """
    Get all generation rules for a specific company.

    Multi-tenant security: Only returns rules for the specified company_id.

    Args:
        db: Database session
        company_id: Company ID for tenant scoping

    Returns:
        List of GenerationRule for the company
    """
    rules = (
        db.query(models.GenerationRule)
        .filter(models.GenerationRule.company_id == company_id)
        .order_by(models.GenerationRule.key)
        .all()
    )

    # Convert datetime objects to strings for Pydantic compatibility
    for rule in rules:
        if hasattr(rule, "created_at") and rule.created_at:
            rule.created_at = rule.created_at.isoformat()
        if hasattr(rule, "updated_at") and rule.updated_at:
            rule.updated_at = rule.updated_at.isoformat()

    return rules


def update_generation_rule(
    db: Session, rule_id: UUID, company_id: UUID, update_data: dict
) -> Optional[models.GenerationRule]:
    """
    Update generation rule with company validation.

    Multi-tenant security: Only allows updates to rules belonging to the company.

    Args:
        db: Database session
        rule_id: Generation rule ID to update
        company_id: Company ID for tenant scoping
        update_data: Dictionary of fields to update

    Returns:
        Updated GenerationRule if found and belongs to company, None otherwise
    """
    rule = (
        db.query(models.GenerationRule)
        .filter(
            models.GenerationRule.id == rule_id,
            models.GenerationRule.company_id == company_id,
        )
        .first()
    )

    if not rule:
        return None

    # Update only allowed fields
    allowed_fields = {"key", "rules"}
    for field, value in update_data.items():
        if field in allowed_fields:
            setattr(rule, field, value)

    db.commit()
    db.refresh(rule)
    return rule


def delete_generation_rule(db: Session, rule_id: UUID, company_id: UUID) -> bool:
    """
    Delete generation rule with company validation.

    Multi-tenant security: Only allows deletion of rules belonging to the company.

    Args:
        db: Database session
        rule_id: Generation rule ID to delete
        company_id: Company ID for tenant scoping

    Returns:
        True if deleted successfully, False if not found or not authorized
    """
    rule = (
        db.query(models.GenerationRule)
        .filter(
            models.GenerationRule.id == rule_id,
            models.GenerationRule.company_id == company_id,
        )
        .first()
    )

    if not rule:
        return False

    db.delete(rule)
    db.commit()
    return True


# Quote Adjustment Log operations
def create_quote_adjustment_log(
    db: Session, adjustment: QuoteAdjustmentLogCreate
) -> models.QuoteAdjustmentLog:
    """
    Create new adjustment log entry.

    Args:
        db: Database session
        adjustment: Adjustment log data

    Returns:
        Created QuoteAdjustmentLog instance
    """
    db_adjustment = models.QuoteAdjustmentLog(**adjustment.dict())
    db.add(db_adjustment)
    db.commit()
    db.refresh(db_adjustment)
    return db_adjustment


def get_adjustment_logs_by_quote(
    db: Session, quote_id: UUID, company_id: UUID
) -> List[models.QuoteAdjustmentLog]:
    """
    Get all adjustment logs for a specific quote with company validation.

    Multi-tenant security: Only returns logs for quotes belonging to the company.

    Args:
        db: Database session
        quote_id: Quote ID to get adjustments for
        company_id: Company ID for tenant scoping

    Returns:
        List of QuoteAdjustmentLog for the quote
    """
    # First verify the quote belongs to the company
    quote = (
        db.query(models.Quote)
        .filter(models.Quote.id == quote_id, models.Quote.company_id == company_id)
        .first()
    )

    if not quote:
        return []

    # Get adjustment logs for this quote
    logs = (
        db.query(models.QuoteAdjustmentLog)
        .filter(models.QuoteAdjustmentLog.quote_id == quote_id)
        .order_by(models.QuoteAdjustmentLog.created_at.desc())
        .all()
    )

    # Convert datetime objects to strings for Pydantic compatibility
    for log in logs:
        if hasattr(log, "created_at") and log.created_at:
            log.created_at = log.created_at.isoformat()

    return logs
