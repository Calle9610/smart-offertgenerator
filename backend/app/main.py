import os
import tempfile
import traceback
import uuid
from datetime import timedelta
from decimal import Decimal
from typing import Any, Dict, List
from uuid import UUID

import jinja2
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from weasyprint import HTML

from . import auth, crud, schemas
from .db import Base, engine, get_db
from .models import Company, LaborRate, Material, PriceProfile, Tenant, User
from .pricing import calc_totals
from .rule_evaluator import RuleEvaluator

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


@app.post("/users", response_model=schemas.User)
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


@app.get("/users/me", response_model=schemas.User)
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
        log_quantity_changes(db, uuid.UUID(quote_id), q.source_items, items)

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
        db, uuid.UUID(requirements_id), company_id, {"data": requirements.dict()}
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

    # Initialize rule evaluator with data dict
    evaluator = RuleEvaluator(schemas.ProjectRequirementsIn(**requirements.data))

    # Generate items based on rules
    generated_items = []
    confidence_levels = []

    try:
        # Process labor rules
        if "labor" in generation_rule.rules:
            for ref, expression in generation_rule.rules["labor"].items():
                qty = evaluator.evaluate_expression(expression)

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
                qty = evaluator.evaluate_expression(expression)

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

        # Calculate totals
        subtotal = sum(item.line_total for item in generated_items)
        vat = subtotal * float(profile.vat_rate) / 100.0
        total = subtotal + vat

        return schemas.AutoGenerateResponse(
            items=generated_items,
            subtotal=subtotal,
            vat=vat,
            total=total,
            confidence_per_item=confidence_levels,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating quote items: {str(e)}",
        )


# PDF generation endpoint (now with authentication)
@app.post("/quotes/{quote_id}/pdf")
async def generate_pdf(
    quote_id: str,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db),
):
    """Generate PDF for a quote (requires authentication)."""
    try:
        # Get quote with tenant validation
        quote = crud.get_quote_by_id_and_tenant(
            db, uuid.UUID(quote_id), current_user.tenant_id
        )
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")

        # Get company and profile info
        company = db.query(Company).filter(Company.id == quote.company_id).first()
        profile = (
            db.query(PriceProfile).filter(PriceProfile.id == quote.profile_id).first()
        )

        # Prepare template context
        context = {
            "quote": quote,
            "company": company,
            "profile": profile,
            "items": quote.items,
            "str": str,  # Make str function available in template
        }

        # Render template
        template = template_env.get_template("quote_template.html")
        html_content = template.render(**context)
        print("Template rendered successfully")

        # Generate PDF
        print("Generating PDF...")
        pdf = HTML(string=html_content).write_pdf()
        print(f"PDF generated, size: {len(pdf)} bytes")

        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(pdf)
            tmp_file_path = tmp_file.name
            print(f"PDF saved to: {tmp_file_path}")

        # Return PDF file
        from fastapi.responses import FileResponse

        return FileResponse(
            tmp_file_path,
            media_type="application/pdf",
            filename=f"quote_{quote_id[:8]}.pdf",
        )

    except Exception as e:
        print(f"Error generating PDF: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to generate PDF")


# Helper function to compare and log quantity changes
def log_quantity_changes(
    db: Session,
    quote_id: UUID,
    source_items: List[Dict[str, Any]],
    final_items: List[Dict[str, Any]],
) -> None:
    """
    Compare source items with final items and log any quantity changes.

    Args:
        db: Database session
        quote_id: ID of the quote being created
        source_items: Original auto-generated items
        final_items: Final items after user adjustments
    """
    if not source_items:
        return  # No source items to compare against

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

        # Compare quantities
        old_qty = source_item.get("qty", 0)
        new_qty = final_item.get("qty", 0)

        if old_qty != new_qty:
            # Log the change
            crud.create_quote_adjustment_log(
                db,
                schemas.QuoteAdjustmentLogCreate(
                    quote_id=quote_id,
                    item_ref=ref,
                    old_qty=old_qty,
                    new_qty=new_qty,
                    reason=f"User adjusted quantity from {old_qty} to {new_qty}",
                ),
            )
