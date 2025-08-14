import os
# import tempfile  # Temporarily disabled
import time
import traceback
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List
from uuid import UUID

import jinja2
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .pdf_generator import pdf_generator

from . import auth, crud, schemas
from .auto_tuning import create_auto_tuning_engine
from .db import Base, engine, get_db
from .models import Company, LaborRate, Material, PriceProfile, Tenant, User, Quote, QuotePackage, QuoteAdjustmentLog, QuoteItem
from .pricing import calc_totals
from .rules_eval import create_rules_evaluator

# Sentry configuration - temporarily disabled for debugging
# import sentry_sdk
# from sentry_sdk.integrations.fastapi import FastApiIntegration
# from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

# # Initialize Sentry
# sentry_sdk.init(
#     dsn=os.getenv("SENTRY_DSN", ""),  # Will be empty if not set
#     environment=os.getenv("ENVIRONMENT", "development"),
#     traces_sample_rate=1.0 if os.getenv("ENVIRONMENT") == "development" else 0.1,
#     profiles_sample_rate=1.0 if os.getenv("ENVIRONMENT") == "development" else 0.1,
#     integrations=[
#         FastApiIntegration(),
#         SqlalchemyIntegration(),
#     ],
# )

app = FastAPI(title="Offert API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Jinja2 template setup
template_loader = jinja2.FileSystemLoader(searchpath="./templates")
template_env = jinja2.Environment(loader=template_loader, autoescape=True)

# Simple in-memory cache for rate-limiting opened events
# In production, use Redis or similar for distributed rate-limiting
_opened_events_cache = {}  # token -> last_opened_timestamp


@app.on_event("startup")
async def startup_event():
    """Initialize database and seed data on startup."""
    try:
        # Create tables
        Base.metadata.create_all(engine)
        print("Database tables created successfully")

        # Seed initial data
        await seed_initial_data()

    except Exception as e:
        print(f"Error during startup: {e}")
        traceback.print_exc()


async def seed_initial_data():
    """Seed initial tenant, user, company, and price profile."""
    db = next(get_db())
    try:
        # Check if we already have data
        existing_tenant = db.query(Tenant).first()
        if existing_tenant:
            print("✅ Tenant already exists, skipping seed")
            return

        # Create default tenant
        default_tenant = crud.create_tenant(
            db, schemas.TenantCreate(name="Default Company", domain="default.local")
        )
        print(f"✅ Created tenant: {default_tenant.name}")

        # Create default user
        default_user = crud.create_user(
            db,
            schemas.UserCreate(
                email="admin@example.com",
                username="admin",
                password="admin123",  # Change this in production!
                full_name="Default Administrator",
                tenant_id=default_tenant.id,
            ),
        )
        print(f"✅ Created user: {default_user.username}")

        # Create default company
        default_company = crud.create_company(
            db,
            schemas.CompanyCreate(
                name="Default Company AB", tenant_id=default_tenant.id
            ),
        )
        print(f"✅ Created company: {default_company.name}")

        # Create default price profile
        default_profile = PriceProfile(
            company_id=default_company.id,
            name="Standard",
            currency="SEK",
            vat_rate=25.00,
        )
        db.add(default_profile)
        db.commit()
        print(f"✅ Created price profile: {default_profile.name}")

    except Exception as e:
        print(f"Error seeding data: {e}")
        traceback.print_exc()
    finally:
        db.close()


@app.get("/")
def root():
    return {"ok": True, "message": "Smart Offertgenerator API"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": "2025-08-12T18:00:00Z"}


# Authentication endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """Login endpoint to get JWT token."""
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "tenant_id": str(user.tenant_id)},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users", response_model=schemas.UserOut)
async def create_user(
    user: schemas.UserCreate, current_user: User = Depends(auth.get_current_active_user)
):
    """Create a new user (requires authentication)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )

    db = next(get_db())
    try:
        # Check if username or email already exists
        if crud.get_user_by_username(db, user.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered",
            )
        if crud.get_user_by_email(db, user.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        return crud.create_user(db, user)
    finally:
        db.close()


@app.get("/users/me", response_model=schemas.UserOut)
async def read_users_me(current_user: User = Depends(auth.get_current_active_user)):
    """Get current user information."""
    return current_user


# Quote endpoints (now with authentication and multi-tenancy)
@app.post("/quotes/calc", response_model=schemas.QuoteOutTotals)
async def calc_quote(
    q: schemas.QuoteIn, current_user: User = Depends(auth.get_current_active_user)
):
    """Calculate quote totals (requires authentication)."""
    items = [{"unit_price": i.unit_price, "qty": i.qty} for i in q.items]
    subtotal, vat, total = calc_totals(items, q.vat_rate)
    return {"subtotal": float(subtotal), "vat": float(vat), "total": float(total)}


@app.post("/quotes", response_model=Dict)
async def create_quote(
    q: schemas.QuoteIn,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new quote (requires authentication)."""

    # Get the user's company
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    items = [
        {
            "kind": i.kind,
            "ref": i.ref,
            "description": i.description,
            "qty": i.qty,
            "unit": i.unit,
            "unit_price": i.unit_price,
        }
        for i in q.items
    ]
    subtotal, vat, total = calc_totals(
        [{"unit_price": i["unit_price"], "qty": i["qty"]} for i in items], q.vat_rate
    )

    quote_id = crud.create_quote(
        db,
        str(current_user.tenant_id),
        str(current_user.id),
        {
            "customer_name": q.customer_name,
            "project_name": q.project_name,
            "company_id": company_id,  # Use company_id from user context
            "profile_id": q.profile_id,
            "currency": q.currency,
            "subtotal": subtotal,
            "vat": vat,
            "total": total,
            "items": items,
        },
    )

    # Log any quantity changes if source_items were provided
    if q.source_items:
        # Get room_type and finish_level for tuning
        room_type = q.room_type
        finish_level = q.finish_level
        
        log_quantity_changes(db, uuid.UUID(quote_id), q.source_items, items, company_id, room_type, finish_level)

    return {
        "id": quote_id,
        "subtotal": float(subtotal),
        "vat": float(vat),
        "total": float(total),
    }


@app.get("/quotes", response_model=List[schemas.QuoteOut])
async def get_quotes(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all quotes for the current user's tenant."""
    quotes = crud.get_quotes_by_tenant(db, current_user.tenant_id)
    return quotes


@app.get("/companies", response_model=List[schemas.Company])
async def get_companies(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all companies for the current user's tenant."""
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    return companies


@app.get("/price-profiles")
async def get_price_profiles(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all price profiles for the current user's company."""
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        return []

    company_id = companies[0].id

    # Get price profiles for this company
    profiles = (
        db.query(PriceProfile).filter(PriceProfile.company_id == company_id).all()
    )

    # Convert to response format
    response_profiles = []
    for profile in profiles:
        response_profiles.append(
            {
                "id": str(profile.id),
                "name": profile.name,
                "company_id": str(profile.company_id),
                "currency": profile.currency,
                "vat_rate": float(profile.vat_rate),
            }
        )

    return response_profiles


# Project Requirements endpoints
@app.post("/project-requirements", response_model=schemas.ProjectRequirementsOut)
async def create_project_requirements(
    requirements: schemas.ProjectRequirementsIn,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create new project requirements with multi-tenant security.

    The company_id from the current user's context is automatically used
    to ensure proper tenant isolation.
    """
    # Get the user's company (assuming one company per user for simplicity)
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    # Create requirements with company scoping
    db_requirements = crud.create_project_requirements(
        db, schemas.ProjectRequirementsCreate(company_id=company_id, data=requirements)
    )

    return db_requirements


@app.get("/project-requirements", response_model=List[schemas.ProjectRequirementsOut])
async def get_project_requirements(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get all project requirements for the current user's company.

    Multi-tenant security: Only returns requirements for the user's company.
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        return []

    company_id = companies[0].id
    requirements = crud.get_project_requirements_by_company(db, company_id)
    return requirements


@app.get(
    "/project-requirements/{requirements_id}",
    response_model=schemas.ProjectRequirementsOut,
)
async def get_project_requirements_by_id(
    requirements_id: str,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get specific project requirements by ID with company validation.

    Multi-tenant security: Only returns requirements belonging to the user's company.
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    requirements = crud.get_project_requirements_by_id(
        db, uuid.UUID(requirements_id), company_id
    )
    if not requirements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project requirements not found",
        )

    return requirements


@app.put(
    "/project-requirements/{requirements_id}",
    response_model=schemas.ProjectRequirementsOut,
)
async def update_project_requirements(
    requirements_id: str,
    requirements: schemas.ProjectRequirementsIn,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update project requirements with company validation.

    Multi-tenant security: Only allows updates to requirements belonging to the user's company.
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    # Update requirements with company scoping
    updated_requirements = crud.update_project_requirements(
        db, uuid.UUID(requirements_id), company_id, {"data": requirements.model_dump()}
    )

    if not updated_requirements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project requirements not found",
        )

    return updated_requirements


@app.delete("/project-requirements/{requirements_id}")
async def delete_project_requirements(
    requirements_id: str,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete project requirements with company validation.

    Multi-tenant security: Only allows deletion of requirements belonging to the user's company.
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    success = crud.delete_project_requirements(
        db, uuid.UUID(requirements_id), company_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project requirements not found",
        )

    return {"message": "Project requirements deleted successfully"}


@app.get("/quotes/{quote_id}/adjustments")
async def get_quote_adjustments(
    quote_id: str,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get adjustment logs for a specific quote with company validation.

    Multi-tenant security: Only returns adjustments for quotes belonging to the user's company.
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    # Get adjustment logs for this quote
    adjustments = crud.get_adjustment_logs_by_quote(db, uuid.UUID(quote_id), company_id)

    # Convert to response format
    response_adjustments = []
    for adj in adjustments:
        response_adjustments.append(
            {
                "id": str(adj.id),
                "quote_id": str(adj.quote_id),
                "item_ref": adj.item_ref,
                "old_qty": str(adj.old_qty),
                "new_qty": str(adj.new_qty),
                "reason": adj.reason,
                "created_at": adj.created_at,
            }
        )

    return response_adjustments


@app.get(
    "/quotes/{quote_id}/project-requirements",
    response_model=schemas.ProjectRequirementsOut,
)
async def get_project_requirements_by_quote(
    quote_id: str,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get project requirements for a specific quote with company validation.

    Multi-tenant security: Only returns requirements for quotes belonging to the user's company.
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    requirements = crud.get_project_requirements_by_quote(
        db, uuid.UUID(quote_id), company_id
    )
    if not requirements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project requirements not found for this quote",
        )

    return requirements


# Generation Rules endpoints
@app.post("/generation-rules")
async def create_generation_rule(
    rule: schemas.GenerationRuleIn,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create new generation rule with multi-tenant security.

    The company_id from the current user's context is automatically used
    to ensure proper tenant isolation.
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    # Create rule with company scoping
    db_rule = crud.create_generation_rule(
        db,
        schemas.GenerationRuleCreate(
            company_id=company_id, key=rule.key, rules=rule.rules
        ),
    )

    # Convert to response format (datetime already converted to strings in CRUD)
    return {
        "id": str(db_rule.id),
        "company_id": str(db_rule.company_id),
        "key": db_rule.key,
        "rules": db_rule.rules,
        "created_at": db_rule.created_at,
        "updated_at": db_rule.updated_at,
    }


@app.get("/generation-rules")
async def get_generation_rules(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get all generation rules for the current user's company.

    Multi-tenant security: Only returns rules for the user's company.
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        return []

    company_id = companies[0].id
    rules = crud.get_generation_rules_by_company(db, company_id)

    # Convert to response format (datetime already converted to strings in CRUD)
    response_rules = []
    for rule in rules:
        response_rules.append(
            {
                "id": str(rule.id),
                "company_id": str(rule.company_id),
                "key": rule.key,
                "rules": rule.rules,
                "created_at": rule.created_at,
                "updated_at": rule.updated_at,
            }
        )

    return response_rules


# Auto-generation endpoint
@app.post("/quotes/autogenerate", response_model=schemas.AutoGenerateResponse)
async def auto_generate_quote(
    request: schemas.AutoGenerateRequest,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Auto-generate quote items based on project requirements and generation rules.
    
    Multi-tenant security: Only uses requirements and rules belonging to the user's company.
    
    cURL Example:
    curl -X POST "http://localhost:8000/quotes/autogenerate" \
         -H "Authorization: Bearer YOUR_JWT_TOKEN" \
         -H "Content-Type: application/json" \
         -d '{
           "requirementsId": "uuid-of-project-requirements",
           "profileId": "uuid-of-price-profile"
         }'
    
    Response includes:
    - items: Generated quote items with quantities and prices
    - subtotal, vat, total: Calculated totals
    - tuning_applied: List of applied tuning factors per item
    - confidence_per_item: Confidence level per item (low/med/high)
    """
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )

    company_id = companies[0].id

    # Get project requirements
    requirements = crud.get_project_requirements_by_id(
        db, uuid.UUID(request.requirements_id), company_id
    )
    if not requirements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project requirements not found",
        )

    # Get price profile
    profile = (
        db.query(PriceProfile)
        .filter(
            PriceProfile.id == uuid.UUID(request.profile_id),
            PriceProfile.company_id == company_id,
        )
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Price profile not found"
        )

    # Build rule key from requirements
    rule_key = f"{requirements.data['room_type']}|{requirements.data['finish_level']}"

    # Get generation rule
    generation_rule = crud.get_generation_rule_by_key(db, company_id, rule_key)
    if not generation_rule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Saknar generation_rule för '{rule_key}'. Skapa en regel för denna kombination av rumstyp och utförandenivå. Exempel: POST /generation-rules med key='{rule_key}' och lämpliga regler för labor och materials.",
        )

    # Initialize rule evaluator with project requirements data
    evaluator = create_rules_evaluator(requirements.data)

    # Generate items based on rules
    generated_items = []
    confidence_levels = []

    try:
        # Process labor rules
        if "labor" in generation_rule.rules:
            for ref, expression in generation_rule.rules["labor"].items():
                try:
                    qty = evaluator.evaluate(expression)
                except ValueError as e:
                    print(f"Error evaluating expression '{expression}' for labor item {ref}: {e}")
                    qty = Decimal('0')

                # Get labor rate for this reference
                labor_rate = (
                    db.query(LaborRate)
                    .filter(
                        LaborRate.company_id == company_id,
                        LaborRate.profile_id == profile.id,
                        LaborRate.code == ref,
                    )
                    .first()
                )

                if labor_rate:
                    unit_price = float(labor_rate.unit_price)
                    description = labor_rate.description or f"Labor: {ref}"
                    unit = labor_rate.unit
                    line_total = float(qty) * unit_price
                    confidence = 0.9  # High confidence for labor items
                else:
                    # Fallback values if labor rate not found
                    unit_price = 0.0
                    description = (
                        f"Labor: {ref} (saknar pris - lägg till i labor_rates tabellen)"
                    )
                    unit = "hour"
                    line_total = 0.0
                    confidence = 0.3  # Low confidence if rate not found

                generated_items.append(
                    schemas.AutoGeneratedItem(
                        kind="labor",
                        ref=ref,
                        description=description,
                        qty=float(qty),
                        unit=unit,
                        unit_price=unit_price,
                        line_total=line_total,
                        confidence_per_item=confidence,
                    )
                )
                confidence_levels.append(confidence)

        # Process material rules
        if "materials" in generation_rule.rules:
            for ref, expression in generation_rule.rules["materials"].items():
                try:
                    qty = evaluator.evaluate(expression)
                except ValueError as e:
                    print(f"Error evaluating expression '{expression}' for material item {ref}: {e}")
                    qty = Decimal('0')

                # Get material for this reference
                material = (
                    db.query(Material)
                    .filter(
                        Material.company_id == company_id,
                        Material.profile_id == profile.id,
                        Material.sku == ref,
                    )
                    .first()
                )

                if material:
                    # Calculate unit price with markup
                    markup_multiplier = 1.0 + (float(material.markup_pct) / 100.0)
                    unit_price = float(material.unit_cost) * markup_multiplier
                    description = material.name
                    unit = material.unit
                    line_total = float(qty) * unit_price
                    confidence = 0.9  # High confidence for material items
                else:
                    # Fallback values if material not found
                    unit_price = 0.0
                    description = f"Material: {ref} (saknar pris - lägg till i materials tabellen)"
                    unit = "pcs"
                    line_total = 0.0
                    confidence = 0.3  # Low confidence if material not found

                generated_items.append(
                    schemas.AutoGeneratedItem(
                        kind="material",
                        ref=ref,
                        description=description,
                        qty=float(qty),
                        unit=unit,
                        unit_price=unit_price,
                        line_total=line_total,
                        confidence_per_item=confidence,
                    )
                )
                confidence_levels.append(confidence)

        # Apply auto-tuning if available
        tuning_applied = []
        confidence_per_item = {}

        try:
            # Get tuning stats for each item
            for item in generated_items:
                tuning_stat = crud.get_tuning_stat_by_key_and_item(
                    db, company_id, rule_key, item.ref
                )
                
                if tuning_stat and tuning_stat.n >= 3:  # Only apply if we have enough data
                    # Apply tuning factor with ±20% clamp
                    factor = float(tuning_stat.median_factor)
                    clamped_factor = max(0.8, min(1.2, factor))
                    
                    # Apply factor to quantity and recalculate line total
                    original_qty = item.qty
                    adjusted_qty = float(original_qty) * clamped_factor
                    adjusted_line_total = adjusted_qty * item.unit_price
                    
                    # Update item
                    item.qty = adjusted_qty
                    item.line_total = adjusted_line_total
                    
                    # Record tuning application
                    tuning_applied.append({
                        "ref": item.ref,
                        "factor": clamped_factor,
                        "original_qty": float(original_qty),
                        "adjusted_qty": adjusted_qty
                    })
                    
                    # Set confidence level based on sample count
                    if tuning_stat.n >= 10:
                        confidence_per_item[item.ref] = "high"
                    elif tuning_stat.n >= 5:
                        confidence_per_item[item.ref] = "med"
                    else:
                        confidence_per_item[item.ref] = "low"
                else:
                    confidence_per_item[item.ref] = "low"  # No tuning data

        except Exception as e:
            # Log error but continue without tuning
            print(f"Auto-tuning error (non-critical): {e}")
            pass

        # Calculate totals
        subtotal = sum(item.line_total for item in generated_items)
        vat_rate = float(profile.vat_rate) / 100.0
        vat = subtotal * vat_rate
        total = subtotal + vat

        return schemas.AutoGenerateResponse(
            items=generated_items,
            subtotal=float(subtotal),
            vat=float(vat),
            total=float(total),
            tuning_applied=tuning_applied,
            confidence_per_item=confidence_per_item,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating quote items: {str(e)}",
        )


# PDF generation endpoint (now with authentication and option handling)
@app.post("/quotes/{quote_id}/pdf")
async def generate_pdf(
    quote_id: str,
    pdf_request: schemas.GeneratePDFRequest,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Generate PDF for a quote with selected options (requires authentication).
    
    The PDF will include only mandatory items + selected optional items,
    matching exactly what the customer sees in the public view.
    
    Example:
    ```bash
    curl -X POST "http://localhost:8000/quotes/123e4567-e89b-12d3-a456-426614174000/pdf" \
         -H "Authorization: Bearer <token>" \
         -H "Content-Type: application/json" \
         -d '{
           "selectedItemIds": ["item-uuid-1", "item-uuid-2"]
         }'
    ```
    """
    try:
        # Get quote with tenant validation
        quote = crud.get_quote_by_id_and_tenant(
            db, uuid.UUID(quote_id), current_user.tenant_id
        )
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Get companies for the user
        companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
        if not companies:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
            )
        
        company = companies[0]
        
        # Get quote items
        quote_items = db.query(QuoteItem).filter(
            QuoteItem.quote_id == quote.id
        ).all()
        
        if not quote_items:
            raise HTTPException(
                status_code=404, detail="No items found for this quote"
            )
        
        # Get price profile for VAT calculation
        profile = db.query(PriceProfile).filter(
            PriceProfile.id == quote.profile_id
        ).first()
        
        if not profile:
            raise HTTPException(
                status_code=404, detail="Price profile not found"
            )
        
        # Generate PDF with selected options
        pdf_bytes = pdf_generator.generate_quote_pdf(
            quote=quote,
            quote_items=quote_items,
            selected_item_ids=pdf_request.selectedItemIds,
            company=company,
            profile=profile
        )
        
        if not pdf_bytes:
            raise HTTPException(
                status_code=501, 
                detail="PDF generation failed - WeasyPrint not available"
            )
        
        # Return PDF as response
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=quote_{quote_id[:8]}.pdf"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


# Test endpoint to create a simple quote for testing
@app.post("/test/create-quote")
async def create_test_quote(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a test quote for testing purposes."""
    try:
        # Get first company for the user
        company = (
            db.query(Company)
            .filter(Company.tenant_id == current_user.tenant_id)
            .first()
        )
        if not company:
            raise HTTPException(status_code=404, detail="No company found")

        # Get first price profile
        profile = (
            db.query(PriceProfile).filter(PriceProfile.company_id == company.id).first()
        )
        if not profile:
            raise HTTPException(status_code=404, detail="No price profile found")

        # Create test quote
        quote_data = {
            "company_id": str(company.id),
            "customer_name": "Test Customer AB",
            "project_name": "Test Project",
            "profile_id": str(profile.id),
            "currency": "SEK",
            "subtotal": Decimal("1000.00"),
            "vat": Decimal("250.00"),
            "total": Decimal("1250.00"),
            "items": [
                {
                    "kind": "labor",
                    "description": "Test Labor",
                    "qty": Decimal("10"),
                    "unit": "hour",
                    "unit_price": Decimal("100.00"),
                }
            ],
        }

        quote_id = crud.create_quote(
            db, current_user.tenant_id, current_user.id, quote_data
        )

        return {"message": "Test quote created", "quote_id": quote_id}

    except Exception as e:
        print(f"Error creating test quote: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to create test quote: {str(e)}"
        )


# Quote send endpoint
@app.post("/quotes/{quote_id}/send", response_model=schemas.QuoteSendResponse)
async def send_quote(
    quote_id: str,
    send_request: schemas.QuoteSendRequest,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Send a quote via email (requires authentication, company-scoped)."""
    try:
        # Get quote with tenant validation
        quote = crud.get_quote_by_id_and_tenant(
            db, uuid.UUID(quote_id), current_user.tenant_id
        )
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")

        # Validate quote status - only draft or reviewed quotes can be sent
        if quote.status not in ["draft", "reviewed"]:
            raise HTTPException(
                status_code=400,
                detail=f"Quote cannot be sent in status '{quote.status}'. Only 'draft' or 'reviewed' quotes can be sent.",
            )

        # Ensure quote has a public_token, generate if missing
        if not quote.public_token:
            import secrets

            quote.public_token = secrets.token_hex(16)
            db.commit()
            db.refresh(quote)
            print(
                f"Generated missing public_token for quote {quote_id}: {quote.public_token}"
            )

        # Generate public URL
        public_app_url = os.getenv("PUBLIC_APP_URL", "http://localhost:3000")
        public_url = f"{public_app_url}/public/quote/{quote.public_token}"

        # Send email via stub (placeholder for SendGrid integration)
        print("📧 SENDING QUOTE EMAIL:")
        print(f"   To: {send_request.toEmail}")
        print(f"   Quote ID: {quote_id}")
        print(f"   Public URL: {public_url}")
        print(f"   Customer: {quote.customer_name}")
        print(f"   Project: {quote.project_name}")
        if send_request.message:
            print(f"   Custom Message: {send_request.message}")
        print(f"   Status: {quote.status} → SENT")

        # Include tracking pixel in email stub
        public_api_url = os.getenv("PUBLIC_API_URL", "http://localhost:8000")
        tracking_pixel_url = f"{public_api_url}/public/pixel/{quote.public_token}.png"
        print(f"   Tracking Pixel: {tracking_pixel_url}")
        print(
            f'   Email HTML would include: <img src="{tracking_pixel_url}" width="1" height="1" />'
        )

        # Update quote status to SENT
        quote.status = "SENT"
        db.commit()
        db.refresh(quote)

        # Create quote event for tracking
        event = crud.create_quote_event(
            db,
            schemas.QuoteEventCreate(
                quote_id=quote.id,
                type="sent",
                meta={
                    "to": send_request.toEmail,
                    "url": public_url,
                    "message": send_request.message,
                    "sent_by": current_user.username,
                    "sent_at": (
                        quote.updated_at.isoformat()
                        if hasattr(quote, "updated_at")
                        else None
                    ),
                },
            ),
        )

        print(f"✅ Quote sent successfully! Event ID: {event.id}")

        return schemas.QuoteSendResponse(
            sent=True,
            public_url=public_url,
            message=f"Quote sent successfully to {send_request.toEmail}",
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending quote: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to send quote: {str(e)}")


# Quote Package endpoints
@app.post("/quotes/{quote_id}/packages/generate")
async def generate_quote_packages(
    quote_id: str,
    generate_request: schemas.QuotePackageGenerateRequest,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate quote packages based on quote items (JWT, company-scoped)."""
    try:
        # Get quote with tenant validation
        quote = crud.get_quote_by_id_and_tenant(
            db, uuid.UUID(quote_id), current_user.tenant_id
        )
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")

        # Generate packages
        packages = crud.generate_quote_packages(
            db=db,
            quote_id=uuid.UUID(quote_id),
            tenant_id=current_user.tenant_id,
            package_names=generate_request.package_names,
            discount_percentages=generate_request.discount_percentages,
        )

        if not packages:
            raise HTTPException(
                status_code=400, detail="No packages could be generated"
            )

        print(f"✅ Generated {len(packages)} packages for quote {quote_id}")

        return {
            "message": f"Successfully generated {len(packages)} packages",
            "packages": [schemas.QuotePackageOut.from_orm(pkg) for pkg in packages],
            "quote_id": quote_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating quote packages: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to generate packages: {str(e)}"
        )


@app.get("/quotes/{quote_id}/packages", response_model=List[schemas.QuotePackageOut])
async def get_quote_packages(
    quote_id: str,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all packages for a specific quote (JWT, company-scoped)."""
    try:
        # Get packages with tenant validation
        packages = crud.get_quote_packages(
            db, uuid.UUID(quote_id), current_user.tenant_id
        )

        if not packages:
            return []

        return [schemas.QuotePackageOut.from_orm(pkg) for pkg in packages]

    except Exception as e:
        print(f"Error getting quote packages: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve packages: {str(e)}"
        )


# Update public quote endpoint to include packages
@app.get("/public/quotes/{token}", response_model=schemas.PublicQuote)
async def get_public_quote(
    token: str,
    db: Session = Depends(get_db),
):
    """Get public quote by token (no authentication required)."""
    try:
        # Get quote by public token
        quote = crud.get_quote_by_public_token(db, token)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")

        # Rate-limited opened event tracking (once per 10 minutes per token)
        current_time = datetime.now().timestamp()
        cache_key = f"opened_{token}"

        if (
            cache_key not in _opened_events_cache
            or current_time - _opened_events_cache[cache_key] > 600
        ):  # 10 minutes = 600 seconds

            # Create opened event
            try:
                event = crud.create_quote_event(
                    db,
                    schemas.QuoteEventCreate(
                        quote_id=quote.id,
                        type="opened",
                        meta={
                            "ip": "unknown",  # Could extract from request if needed
                            "user_agent": "unknown",  # Could extract from request if needed
                            "opened_at": datetime.now().isoformat(),
                        },
                    ),
                )
                print(f"📖 Quote opened event created: {event.id}")

                # Update cache
                _opened_events_cache[cache_key] = current_time

                # Clean up old cache entries (keep only last 1000)
                if len(_opened_events_cache) > 1000:
                    # Remove oldest entries
                    sorted_cache = sorted(
                        _opened_events_cache.items(), key=lambda x: x[1]
                    )
                    _opened_events_cache.clear()
                    _opened_events_cache.update(dict(sorted_cache[-500:]))

            except Exception as e:
                print(f"Warning: Could not create opened event: {e}")
                # Don't fail the request if event creation fails

        # Get company name if available
        company_name = None
        try:
            company = db.query(Company).filter(Company.id == quote.company_id).first()
            if company:
                company_name = company.name
        except Exception:
            pass  # Don't fail if company lookup fails

        # Convert items to public format
        public_items = []
        for item in quote.items:
            public_items.append(
                schemas.PublicQuoteItem(
                    kind=item.kind,
                    description=item.description,
                    qty=item.qty,
                    unit=item.unit or "",
                    unit_price=item.unit_price,
                    line_total=item.line_total,
                )
            )

        # Get packages for this quote
        packages = []
        try:
            quote_packages = crud.get_quote_packages(
                db, quote.id, quote.tenant_id
            )
            for pkg in quote_packages:
                package_items = []
                for item in pkg.items:
                    package_items.append(
                        schemas.PublicQuoteItem(
                            kind=item["kind"],
                            description=item.get("description"),
                            qty=item["qty"],
                            unit=item["unit"] or "",
                            unit_price=item["unit_price"],
                            line_total=item["line_total"],
                        )
                    )
                
                packages.append(
                    schemas.PublicQuotePackage(
                        id=pkg.id,
                        name=pkg.name,
                        items=package_items,
                        subtotal=pkg.subtotal,
                        vat=pkg.vat,
                        total=pkg.total,
                        is_default=pkg.is_default,
                    )
                )
        except Exception as e:
            print(f"Warning: Could not retrieve packages: {e}")
            # Don't fail the request if package retrieval fails

        # Get additional fields from project requirements if available
        summary = None
        assumptions = None
        exclusions = None
        timeline = None

        try:
            requirements = crud.get_project_requirements_by_quote(
                db, quote.id, quote.company_id
            )
            if requirements and requirements.data:
                data = requirements.data
                summary = data.get("notes", data.get("summary"))
                assumptions = data.get("assumptions")
                exclusions = data.get("exclusions")
                timeline = data.get("timeline")
        except Exception:
            pass  # Don't fail if requirements lookup fails

        return schemas.PublicQuote(
            company_name=company_name,
            project_name=quote.project_name,
            customer_name=quote.customer_name,  # Could mask this if needed
            currency=quote.currency,
            items=public_items,
            subtotal=quote.subtotal,
            vat=quote.vat,
            total=quote.total,
            packages=packages,
            accepted_package_id=quote.accepted_package_id,
            summary=summary,
            assumptions=assumptions,
            exclusions=exclusions,
            timeline=timeline,
            created_at=quote.created_at.isoformat() if quote.created_at else "",
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting public quote: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to retrieve quote")


# Update accept quote endpoint to handle package acceptance
@app.post("/public/quotes/{token}/accept")
async def accept_public_quote(
    token: str,
    accept_request: schemas.QuotePackageAcceptRequest,
    db: Session = Depends(get_db),
):
    """Accept a public quote package by token (no authentication required)."""
    try:
        # Get quote by public token
        quote = crud.get_quote_by_public_token(db, token)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")

        # Check if already accepted (idempotency) - check this FIRST
        if quote.status == "ACCEPTED":
            return {"message": "Quote already accepted", "status": "ACCEPTED"}

        # Check if quote can be accepted (only SENT or REVIEWED status)
        if quote.status not in ["SENT", "REVIEWED"]:
            raise HTTPException(
                status_code=400,
                detail=f"Quote cannot be accepted in status '{quote.status}'. Only 'SENT' or 'REVIEWED' quotes can be accepted.",
            )

        # Update quote to mark package as accepted
        updated_quote = crud.update_quote_accepted_package(
            db, quote.id, accept_request.packageId, quote.tenant_id
        )
        
        if not updated_quote:
            raise HTTPException(
                status_code=400, detail="Invalid package ID or package not found"
            )

        # Update quote status to ACCEPTED
        quote.status = "ACCEPTED"
        db.commit()
        db.refresh(quote)

        # Get package name for event logging
        package_name = "Unknown"
        try:
            package = db.query(QuotePackage).filter(
                QuotePackage.id == accept_request.packageId
            ).first()
            if package:
                package_name = package.name
        except Exception:
            pass

        # Create accepted event with package information
        try:
            event = crud.create_quote_event(
                db,
                schemas.QuoteEventCreate(
                    quote_id=quote.id,
                    type="accepted",
                    meta={
                        "ip": "unknown",  # Could extract from request if needed
                        "user_agent": "unknown",  # Could extract from request if needed
                        "accepted_at": datetime.now().isoformat(),
                        "previous_status": quote.status,
                        "package_id": str(accept_request.packageId),
                        "package_name": package_name,
                    },
                ),
            )
            print(f"✅ Quote accepted event created: {event.id}")
        except Exception as e:
            print(f"Warning: Could not create accepted event: {e}")
            # Don't fail the request if event creation fails

        print(f"🎉 Quote {quote.id} accepted with package {package_name}! Status: {quote.status}")

        return {
            "message": f"Quote accepted successfully with package: {package_name}",
            "status": "ACCEPTED",
            "quote_id": str(quote.id),
            "package_id": str(accept_request.packageId),
            "package_name": package_name,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error accepting quote: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to accept quote")


# Decline quote endpoint (no authentication required)
@app.post("/public/quotes/{token}/decline")
async def decline_public_quote(
    token: str,
    db: Session = Depends(get_db),
):
    """Decline a public quote by token (no authentication required)."""
    try:
        # Get quote by public token
        quote = crud.get_quote_by_public_token(db, token)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")

        # Check if already declined (idempotency)
        if quote.status == "DECLINED":
            return {"message": "Quote already declined", "status": "DECLINED"}

        # Check if quote can be declined (only SENT or REVIEWED status)
        if quote.status not in ["SENT", "REVIEWED"]:
            raise HTTPException(
                status_code=400,
                detail=f"Quote cannot be declined in status '{quote.status}'. Only 'SENT' or 'REVIEWED' quotes can be declined.",
            )

        # Update quote status to DECLINED
        quote.status = "DECLINED"
        db.commit()
        db.refresh(quote)

        # Create declined event
        try:
            event = crud.create_quote_event(
                db,
                schemas.QuoteEventCreate(
                    quote_id=quote.id,
                    type="declined",
                    meta={
                        "ip": "unknown",  # Could extract from request if needed
                        "user_agent": "unknown",  # Could extract from request if needed
                        "declined_at": datetime.now().isoformat(),
                        "previous_status": quote.status,
                    },
                ),
            )
            print(f"❌ Quote declined event created: {event.id}")
        except Exception as e:
            print(f"Warning: Could not create declined event: {e}")
            # Don't fail the request if event creation fails

        print(f"💔 Quote {quote.id} declined! Status: {quote.status}")

        return {
            "message": "Quote declined successfully",
            "status": "DECLINED",
            "quote_id": str(quote.id),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error declining quote: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to decline quote")


# Tracking pixel endpoint for email open tracking
@app.get("/public/pixel/{token}.png")
async def tracking_pixel(
    token: str,
    db: Session = Depends(get_db),
):
    """Tracking pixel endpoint for email open tracking (no authentication required)."""
    try:
        # Get quote by public token
        quote = crud.get_quote_by_public_token(db, token)
        if not quote:
            # Return 1x1 transparent PNG even if quote not found (for security)
            # This prevents attackers from determining valid tokens
            pass
        else:
            # Rate-limited opened event tracking (once per 10 minutes per token)
            current_time = time.time()
            cache_key = f"opened_{token}"

            if (
                cache_key not in _opened_events_cache
                or current_time - _opened_events_cache[cache_key] > 600
            ):  # 10 minutes = 600 seconds

                # Create opened event
                try:
                    event = crud.create_quote_event(
                        db,
                        schemas.QuoteEventCreate(
                            quote_id=quote.id,
                            type="opened",
                            meta={
                                "ip": "unknown",  # Could extract from request if needed
                                "user_agent": "unknown",  # Could extract from request if needed
                                "opened_at": datetime.now().isoformat(),
                                "source": "tracking_pixel",
                            },
                        ),
                    )
                    print(f"📖 Quote opened event created via pixel: {event.id}")

                    # Update cache
                    _opened_events_cache[cache_key] = current_time

                except Exception as e:
                    print(f"Warning: Could not create opened event via pixel: {e}")
                    # Don't fail the request if event creation fails

        # Create 1x1 transparent PNG in memory
        # This is a minimal PNG file with transparency
        png_data = bytes(
            [
                0x89,
                0x50,
                0x4E,
                0x47,
                0x0D,
                0x0A,
                0x1A,
                0x0A,  # PNG signature
                0x00,
                0x00,
                0x00,
                0x0D,
                0x49,
                0x48,
                0x44,
                0x52,  # IHDR chunk
                0x00,
                0x00,
                0x00,
                0x01,
                0x00,
                0x00,
                0x00,
                0x01,  # 1x1 dimensions
                0x08,
                0x02,
                0x00,
                0x00,
                0x00,
                0x90,
                0x77,
                0x53,  # Color type, compression, filter, interlace
                0xDE,
                0x00,
                0x00,
                0x00,
                0x0C,
                0x49,
                0x44,
                0x41,  # IDAT chunk
                0x54,
                0x08,
                0x99,
                0x01,
                0x01,
                0x00,
                0x00,
                0x00,  # Compressed data (1 transparent pixel)
                0xFF,
                0xFF,
                0x00,
                0x00,
                0x00,
                0x02,
                0x00,
                0x01,  # End of compressed data
                0x00,
                0x00,
                0x00,
                0x00,
                0x49,
                0x45,
                0x4E,
                0x44,  # IEND chunk
                0xAE,
                0x42,
                0x60,
                0x82,  # IEND signature
            ]
        )

        from fastapi.responses import Response

        return Response(
            content=png_data,
            media_type="image/png",
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )

    except Exception as e:
        print(f"Error in tracking pixel: {e}")
        traceback.print_exc()
        # Return 1x1 transparent PNG even on error (for security)
        png_data = bytes(
            [
                0x89,
                0x50,
                0x4E,
                0x47,
                0x0D,
                0x0A,
                0x1A,
                0x0A,
                0x00,
                0x00,
                0x00,
                0x0D,
                0x49,
                0x48,
                0x44,
                0x52,
                0x00,
                0x00,
                0x00,
                0x01,
                0x00,
                0x00,
                0x00,
                0x01,
                0x08,
                0x02,
                0x00,
                0x00,
                0x00,
                0x90,
                0x77,
                0x53,
                0xDE,
                0x00,
                0x00,
                0x00,
                0x0C,
                0x49,
                0x44,
                0x41,
                0x54,
                0x08,
                0x99,
                0x01,
                0x01,
                0x00,
                0x00,
                0x00,
                0xFF,
                0xFF,
                0x00,
                0x00,
                0x00,
                0x02,
                0x00,
                0x01,
                0x00,
                0x00,
                0x00,
                0x00,
                0x49,
                0x45,
                0x4E,
                0x44,
                0xAE,
                0x42,
                0x60,
                0x82,
            ]
        )

        from fastapi.responses import Response

        return Response(
            content=png_data,
            media_type="image/png",
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )


# Helper function to compare and log quantity changes
def log_quantity_changes(
    db: Session,
    quote_id: UUID,
    source_items: List[Dict[str, Any]],
    final_items: List[Dict[str, Any]],
    company_id: UUID,
    room_type: str = None,
    finish_level: str = None,
) -> None:
    """
    Compare source items with final items and log any quantity changes.

    Args:
        db: Database session
        quote_id: ID of the quote being created
        source_items: Original auto-generated items
        final_items: Final items after user adjustments
        company_id: Company ID for multi-tenancy
        room_type: Room type from project requirements (for tuning)
        finish_level: Finish level from project requirements (for tuning)
    """
    if not source_items:
        return  # No source items to compare against

    # Create tuning helper if we have room_type and finish_level
    tuning_helper = None
    if room_type and finish_level:
        try:
            from .tuning import create_tuning_helper
            tuning_helper = create_tuning_helper(db, company_id)
        except ImportError:
            print("Warning: Tuning helper not available, falling back to basic logging")
            tuning_helper = None

    # Create a lookup dictionary for source items by ref
    source_lookup = {}
    for item in source_items:
        ref = item.get("ref") or item.get("description", "")
        if ref:
            source_lookup[ref] = item

    # Compare each final item with its source
    for final_item in final_items:
        ref = final_item.get("ref") or final_item.get("description", "")
        if not ref:
            continue

        source_item = source_lookup.get(ref)
        if not source_item:
            continue

        # Compare quantities with 1% threshold
        old_qty = Decimal(str(source_item.get("qty", 0)))
        new_qty = Decimal(str(final_item.get("qty", 0)))
        
        # Calculate percentage difference
        if old_qty > 0:
            percentage_diff = abs(new_qty - old_qty) / old_qty
            threshold = Decimal('0.01')  # 1%
            
            if percentage_diff >= threshold:
                if tuning_helper and room_type and finish_level:
                    # Use advanced tuning helper
                    try:
                        tuning_helper.log_adjustment_and_update_tuning(
                            quote_id=quote_id,
                            item_ref=ref,
                            old_qty=old_qty,
                            new_qty=new_qty,
                            room_type=room_type,
                            finish_level=finish_level,
                            adjustment_reason=f"User adjusted quantity from {old_qty} to {new_qty} (diff: {percentage_diff:.1%})"
                        )
                    except Exception as e:
                        print(f"Error in tuning helper: {e}")
                        # Fall back to basic logging
                        _log_basic_adjustment(db, quote_id, ref, old_qty, new_qty)
                else:
                    # Use basic logging
                    _log_basic_adjustment(db, quote_id, ref, old_qty, new_qty)


def _log_basic_adjustment(
    db: Session,
    quote_id: UUID,
    item_ref: str,
    old_qty: Decimal,
    new_qty: Decimal,
) -> None:
    """Basic adjustment logging without tuning integration."""
    try:
        crud.create_quote_adjustment_log(
            db,
            schemas.QuoteAdjustmentLogCreate(
                quote_id=quote_id,
                item_ref=item_ref,
                old_qty=old_qty,
                new_qty=new_qty,
                reason=f"User adjusted quantity from {old_qty} to {new_qty}",
            ),
        )
    except Exception as e:
        print(f"Error logging basic adjustment: {e}")


@app.post("/quotes/{quote_id}/adjustments", response_model=schemas.QuoteAdjustmentOut)
async def log_quote_adjustment(
    quote_id: str,
    adjustment: schemas.QuoteAdjustmentIn,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Log a user adjustment to a quote item for auto-tuning analysis.
    
    This endpoint captures how users modify auto-generated quantities and prices,
    enabling the system to learn and improve future auto-generation accuracy.
    
    Multi-tenant security: Only allows adjustments to quotes belonging to the user's company.
    
    Example:
    ```bash
    curl -X POST "http://localhost:8000/quotes/123e4567-e89b-12d3-a456-426614174000/adjustments" \
         -H "Authorization: Bearer <token>" \
         -H "Content-Type: application/json" \
         -d '{
           "item_ref": "SNICK",
           "item_kind": "labor",
           "original_qty": 8.0,
           "adjusted_qty": 10.0,
           "original_unit_price": 650.00,
           "adjusted_unit_price": 650.00,
           "adjustment_reason": "Behöver mer tid för detaljarbete"
         }'
    ```
    """
    # Get companies for the user
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )
    
    company_id = companies[0].id
    
    # Verify quote belongs to user's company
    quote = db.query(Quote).filter(
        Quote.id == uuid.UUID(quote_id),
        Quote.company_id == company_id
    ).first()
    
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Quote not found"
        )
    
    # Create auto-tuning engine and log adjustment
    tuning_engine = create_auto_tuning_engine(db, company_id)
    tuning_engine.log_adjustment(
        quote_id=uuid.UUID(quote_id),
        user_id=current_user.id,
        item_ref=adjustment.item_ref,
        item_kind=adjustment.item_kind,
        original_qty=adjustment.original_qty,
        adjusted_qty=adjustment.adjusted_qty,
        original_unit_price=adjustment.original_unit_price,
        adjusted_unit_price=adjustment.adjusted_unit_price,
        adjustment_reason=adjustment.adjustment_reason,
    )
    
    # Return the logged adjustment
    adjustment_log = db.query(QuoteAdjustmentLog).filter(
        QuoteAdjustmentLog.quote_id == uuid.UUID(quote_id),
        QuoteAdjustmentLog.item_ref == adjustment.item_ref,
        QuoteAdjustmentLog.company_id == company_id
    ).order_by(QuoteAdjustmentLog.created_at.desc()).first()
    
    if not adjustment_log:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log adjustment"
        )
    
    return adjustment_log


@app.get("/auto-tuning/insights", response_model=schemas.AutoTuningInsightsResponse)
async def get_auto_tuning_insights(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get insights about auto-tuning patterns for analytics.
    
    Returns learned adjustment patterns that show how the system is improving
    based on user feedback. Useful for understanding system accuracy and
    identifying areas for improvement.
    
    Multi-tenant security: Only returns insights for the user's company.
    
    Example:
    ```bash
    curl -X GET "http://localhost:8000/auto-tuning/insights" \
         -H "Authorization: Bearer <token>"
    ```
    
    Response includes:
    - Adjustment patterns for different room types and finish levels
    - Confidence scores for each pattern
    - Human-readable interpretations of adjustments
    - Suggestions for improving system accuracy
    """
    # Get companies for the user
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )
    
    company_id = companies[0].id
    
    # Get auto-tuning insights
    tuning_engine = create_auto_tuning_engine(db, company_id)
    insights = tuning_engine.get_tuning_insights()
    
    # Calculate summary statistics
    total_patterns = len(insights)
    if total_patterns > 0:
        average_confidence = sum(insight["confidence_score"] for insight in insights) / total_patterns
        
        # Find most adjusted item
        item_counts = {}
        for insight in insights:
            item_ref = insight["item_ref"]
            item_counts[item_ref] = item_counts.get(item_ref, 0) + insight["sample_count"]
        
        most_adjusted_item = max(item_counts.items(), key=lambda x: x[1])[0] if item_counts else None
        
        # Generate improvement suggestions
        improvement_suggestions = []
        low_confidence_patterns = [insight for insight in insights if insight["confidence_score"] < 0.7]
        if low_confidence_patterns:
            improvement_suggestions.append(
                f"Flera mönster har låg konfidens ({len(low_confidence_patterns)} st). "
                "Överväg att samla in mer data för dessa kombinationer."
            )
        
        extreme_adjustments = [insight for insight in insights if insight["adjustment_factor"] > 2.0 or insight["adjustment_factor"] < 0.5]
        if extreme_adjustments:
            improvement_suggestions.append(
                f"Flera mönster visar extrema justeringar ({len(extreme_adjustments)} st). "
                "Kontrollera grundreglerna för dessa kombinationer."
            )
        
        if not improvement_suggestions:
            improvement_suggestions.append("Systemet lär sig bra från användarjusteringar. Fortsätt att använda auto-generering.")
    else:
        average_confidence = 0.0
        most_adjusted_item = None
        improvement_suggestions = ["Inga justeringsmönster ännu. Systemet kommer att lära sig när du börjar justera offerter."]
    
    return schemas.AutoTuningInsightsResponse(
        insights=insights,
        total_patterns=total_patterns,
        average_confidence=average_confidence,
        most_adjusted_item=most_adjusted_item,
        improvement_suggestions=improvement_suggestions,
    )


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.get("/admin/rules", response_model=List[schemas.GenerationRuleOut])
async def get_generation_rules(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get all generation rules for the current user's company.
    
    Multi-tenant security: Only returns rules for the user's company.
    
    Example:
    ```bash
    curl -X GET "http://localhost:8000/admin/rules" \
         -H "Authorization: Bearer <token>"
    ```
    """
    # Get companies for the user
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )
    
    company_id = companies[0].id
    
    # Get generation rules for the company
    rules = crud.get_generation_rules_by_company(db, company_id)
    return rules


@app.put("/admin/rules/{rule_id}", response_model=schemas.GenerationRuleOut)
async def update_generation_rule(
    rule_id: str,
    rule_update: schemas.GenerationRuleUpdate,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update a generation rule.
    
    Multi-tenant security: Only allows updates to rules owned by the user's company.
    
    Example:
    ```bash
    curl -X PUT "http://localhost:8000/admin/rules/123e4567-e89b-12d3-a456-426614174000" \
         -H "Authorization: Bearer <token>" \
         -H "Content-Type: application/json" \
         -d '{
           "rules": {
             "labor": {"SNICK": "8+2*areaM2"},
             "materials": {"KAKEL20": "areaM2*1.2"}
           }
         }'
    ```
    """
    # Get companies for the user
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )
    
    company_id = companies[0].id
    
    # Get the rule and verify ownership
    rule = crud.get_generation_rule_by_id(db, rule_id)
    if not rule or rule.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found"
        )
    
    # Update the rule
    updated_rule = crud.update_generation_rule(db, rule_id, rule_update)
    return updated_rule


@app.post("/admin/rules/test", response_model=schemas.RuleTestResponse)
async def test_generation_rule(
    test_request: schemas.RuleTestRequest,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Test a generation rule against sample requirements data.
    
    This endpoint allows testing rules without saving any data.
    Useful for validating rule syntax and seeing expected output.
    
    Multi-tenant security: Only allows testing rules owned by the user's company.
    
    Example:
    ```bash
    curl -X POST "http://localhost:8000/admin/rules/test" \
         -H "Authorization: Bearer <token>" \
         -H "Content-Type: application/json" \
         -d '{
           "key": "bathroom|standard",
           "requirementsData": {
             "areaM2": 15.5,
             "hasPlumbingWork": 1,
             "hasElectricalWork": 0
           }
         }'
    ```
    
    Response includes:
    - Generated items with quantities and prices
    - Calculated totals (subtotal, VAT, total)
    - No data is saved to the database
    """
    # Get companies for the user
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )
    
    company_id = companies[0].id
    
    # Get the generation rule
    rule = crud.get_generation_rule_by_key(db, company_id, test_request.key)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"No generation rule found for key: {test_request.key}"
        )
    
    try:
        # Create rules evaluator with test data
        evaluator = create_rules_evaluator(test_request.requirementsData)
        
        # Generate items based on the rule
        generated_items = []
        
        # Process labor items
        if "labor" in rule.rules:
            for ref, expression in rule.rules["labor"].items():
                try:
                    qty = evaluator.evaluate(expression)
                    # Get labor rate for this item
                    labor_rate = crud.get_labor_rate_by_code(db, company_id, ref)
                    if labor_rate:
                        unit_price = float(labor_rate.unit_price)
                        line_total = float(qty) * unit_price
                        
                        generated_items.append({
                            "kind": "labor",
                            "ref": ref,
                            "description": labor_rate.description or f"Arbete {ref}",
                            "qty": float(qty),
                            "unit": labor_rate.unit or "hour",
                            "unit_price": unit_price,
                            "line_total": line_total
                        })
                except ValueError as e:
                    # Skip items with invalid expressions
                    print(f"Warning: Invalid expression '{expression}' for {ref}: {e}")
                    continue
        
        # Process material items
        if "materials" in rule.rules:
            for ref, expression in rule.rules["materials"].items():
                try:
                    qty = evaluator.evaluate(expression)
                    # Get material for this item
                    material = crud.get_material_by_code(db, company_id, ref)
                    if material:
                        # Calculate unit price with markup
                        unit_cost = float(material.unit_cost)
                        markup_pct = float(material.markup_pct or 0)
                        unit_price = unit_cost * (1 + markup_pct / 100)
                        unit_price = round(unit_price, 2)
                        line_total = float(qty) * unit_price
                        
                        generated_items.append({
                            "kind": "material",
                            "ref": ref,
                            "description": material.description or f"Material {ref}",
                            "qty": float(qty),
                            "unit": material.unit or "st",
                            "unit_price": unit_price,
                            "line_total": line_total
                        })
                except ValueError as e:
                    # Skip items with invalid expressions
                    print(f"Warning: Invalid expression '{expression}' for {ref}: {e}")
                    continue
        
        if not generated_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid items could be generated from the rule"
            )
        
        # Calculate totals
        subtotal = sum(item["line_total"] for item in generated_items)
        vat_rate = 25.0  # Default VAT rate, could be made configurable
        vat = subtotal * vat_rate / 100.0
        total = subtotal + vat
        
        return schemas.RuleTestResponse(
            items=generated_items,
            subtotal=round(subtotal, 2),
            vat=round(vat, 2),
            total=round(total, 2)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error testing rule: {str(e)}"
        )


# ============================================================================
# OPTION GROUPS ENDPOINTS
# ============================================================================

@app.get("/quotes/{quote_id}/options", response_model=schemas.QuoteOptionGroupsResponse)
async def get_quote_option_groups(
    quote_id: str,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get option groups for a quote with their items.
    
    Multi-tenant security: Only returns options for quotes belonging to the user's company.
    
    Example:
    ```bash
    curl -X GET "http://localhost:8000/quotes/123e4567-e89b-12d3-a456-426614174000/options" \
         -H "Authorization: Bearer <token>"
    ```
    
    Response includes:
    - option_groups: List of option groups with their items
    - current_total: Current quote total with selected options
    - base_total: Base quote total without optional items
    """
    # Get companies for the user
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )
    
    company_id = companies[0].id
    
    # Get option groups for the quote
    option_groups = crud.get_quote_option_groups(db, uuid.UUID(quote_id), company_id)
    
    # Get current quote totals
    quote = crud.get_quote_by_id_and_tenant(db, uuid.UUID(quote_id), current_user.tenant_id)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Quote not found"
        )
    
    # Calculate base total (without optional items)
    base_items = db.query(models.QuoteItem).filter(
        models.QuoteItem.quote_id == uuid.UUID(quote_id),
        models.QuoteItem.is_optional == False
    ).all()
    
    base_subtotal = sum(item.line_total for item in base_items)
    
    return schemas.QuoteOptionGroupsResponse(
        quote_id=uuid.UUID(quote_id),
        option_groups=option_groups,
        current_total=quote.total,
        base_total=base_subtotal
    )


@app.post("/quotes/{quote_id}/options", response_model=schemas.UpdateQuoteOptionsResponse)
async def update_quote_options(
    quote_id: str,
    update_request: schemas.UpdateQuoteOptionsRequest,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update selected options for a quote and recalculate totals.
    
    Multi-tenant security: Only allows updates to quotes belonging to the user's company.
    
    Example:
    ```bash
    curl -X POST "http://localhost:8000/quotes/123e4567-e89b-12d3-a456-426614174000/options" \
         -H "Authorization: Bearer <token>" \
         -H "Content-Type: application/json" \
         -d '{
           "selected_items": ["item-uuid-1", "item-uuid-2"],
           "deselected_items": ["item-uuid-3"]
         }'
    ```
    
    Response includes:
    - success: Whether the update was successful
    - new_total: Updated quote total
    - message: Status message
    - updated_items: Updated items with selection status
    """
    # Get companies for the user
    companies = crud.get_companies_by_tenant(db, current_user.tenant_id)
    if not companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No company found for user"
        )
    
    company_id = companies[0].id
    
    try:
        # Update quote options
        result = crud.update_quote_options(
            db, 
            uuid.UUID(quote_id), 
            company_id, 
            [uuid.UUID(item_id) for item_id in update_request.selected_items]
        )
        
        # Get updated items for response
        updated_items = []
        for item_id in update_request.selected_items:
            item = db.query(models.QuoteItem).filter(
                models.QuoteItem.id == uuid.UUID(item_id),
                models.QuoteItem.quote_id == uuid.UUID(quote_id)
            ).first()
            
            if item:
                updated_items.append(schemas.OptionGroupItem(
                    id=item.id,
                    kind=item.kind,
                    ref=item.ref,
                    description=item.description or "",
                    qty=item.qty,
                    unit=item.unit or "",
                    unit_price=item.unit_price,
                    line_total=item.line_total,
                    is_optional=item.is_optional,
                    option_group=item.option_group or "",
                    is_selected=True
                ))
        
        return schemas.UpdateQuoteOptionsResponse(
            success=True,
            new_total=result["new_total"],
            message=f"Quote options updated successfully. New total: {result['new_total']:.2f} SEK",
            updated_items=updated_items
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update quote options: {str(e)}"
        )


# Update quote selection endpoint (no authentication required)
@app.post("/public/quotes/{token}/update-selection")
async def update_public_quote_selection(
    token: str,
    selection_request: schemas.PublicQuoteSelectionUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update selected options for a public quote and recalculate totals.
    
    This endpoint allows customers to select/deselect optional items and see
    real-time updates to the quote total without requiring authentication.
    
    Example:
    ```bash
    curl -X POST "http://localhost:8000/public/quotes/abc123/update-selection" \
         -H "Content-Type: application/json" \
         -d '{
           "selectedItemIds": ["item-uuid-1", "item-uuid-2"]
         }'
    ```
    
    Response includes:
    - items: List of all quote items with selection status
    - subtotal: Updated subtotal based on selected items
    - vat: Updated VAT amount
    - total: Updated total amount
    """
    try:
        # Get quote by public token
        quote = crud.get_quote_by_public_token(db, token)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        
        # Check if quote can be updated (only SENT or REVIEWED status)
        if quote.status not in ["SENT", "REVIEWED"]:
            raise HTTPException(
                status_code=400,
                detail=f"Quote cannot be updated in status '{quote.status}'. Only 'SENT' or 'REVIEWED' quotes can be updated."
            )
        
        # Get all quote items
        quote_items = db.query(QuoteItem).filter(
            QuoteItem.quote_id == quote.id
        ).all()
        
        if not quote_items:
            raise HTTPException(
                status_code=404, detail="No items found for this quote"
            )
        
        # Create a set of selected item IDs for fast lookup
        selected_ids = set(selection_request.selectedItemIds)
        
        # Mark items as selected and calculate totals
        base_subtotal = Decimal('0')
        optional_subtotal = Decimal('0')
        updated_items = []
        
        for item in quote_items:
            # Mark isSelected based on whether item ID is in selectedItemIds
            is_selected = str(item.id) in selected_ids
            
            # Calculate line total for this item
            if item.is_optional:
                # For optional items, only include if selected
                if is_selected:
                    optional_subtotal += item.line_total
                    line_total = item.line_total
                else:
                    line_total = Decimal('0')
            else:
                # For mandatory items, always include
                base_subtotal += item.line_total
                line_total = item.line_total
            
            # Create item response with selection status
            item_response = {
                "id": str(item.id),
                "kind": item.kind,
                "ref": item.ref,
                "description": item.description,
                "qty": item.qty,
                "unit": item.unit,
                "unit_price": item.unit_price,
                "line_total": float(line_total),
                "is_optional": item.is_optional,
                "option_group": item.option_group,
                "isSelected": is_selected
            }
            updated_items.append(item_response)
        
        # Calculate new totals
        new_subtotal = base_subtotal + optional_subtotal
        
        # Get VAT rate from quote profile
        profile = db.query(PriceProfile).filter(
            PriceProfile.id == quote.profile_id
        ).first()
        
        vat_rate = float(profile.vat_rate) / 100.0 if profile else 0.25
        new_vat = new_subtotal * Decimal(str(vat_rate))
        new_total = new_subtotal + new_vat
        
        # Log the selection update event
        try:
            # Calculate differences for logging
            previous_total = quote.total
            total_difference = new_total - previous_total
            
            # Get previous selection state (this would need to be tracked, but for now we'll log the change)
            event_meta = {
                "ip": "unknown",  # Could extract from request if needed
                "user_agent": "unknown",  # Could extract from request if needed
                "updated_at": datetime.now().isoformat(),
                "selected_item_count": len(selected_ids),
                "total_items": len(quote_items),
                "previous_total": float(previous_total),
                "new_total": float(new_total),
                "total_difference": float(total_difference),
                "selected_item_ids": list(selected_ids),
                "base_subtotal": float(base_subtotal),
                "optional_subtotal": float(optional_subtotal)
            }
            
            event = crud.create_quote_event(
                db,
                schemas.QuoteEventCreate(
                    quote_id=quote.id,
                    type="option_updated",
                    meta=event_meta
                )
            )
            print(f"✅ Quote selection update event created: {event.id}")
        except Exception as e:
            print(f"Warning: Could not create selection update event: {e}")
            # Don't fail the request if event creation fails
        
        print(f"🔄 Quote {quote.id} selection updated! New total: {new_total:.2f} SEK (was: {previous_total:.2f} SEK)")
        
        return {
            "items": updated_items,
            "subtotal": float(new_subtotal),
            "vat": float(new_vat),
            "total": float(new_total),
            "base_subtotal": float(base_subtotal),
            "optional_subtotal": float(optional_subtotal),
            "selected_item_count": len(selected_ids),
            "message": f"Quote selection updated successfully. New total: {new_total:.2f} SEK"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating quote selection: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update quote selection")


# ============================================================================
# ADMIN RULES ENDPOINTS
# ============================================================================
