from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Dict
import os
from datetime import datetime, timedelta
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import tempfile
from .db import Base, engine, get_db
from .pricing import calc_totals
from . import schemas, crud, models

app = FastAPI(title="Offert API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get company ID from environment or use default
COMPANY_ID = os.getenv("COMPANY_ID", "00000000-0000-0000-0000-000000000001")

# Setup Jinja2 template environment
template_dir = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(loader=FileSystemLoader(template_dir))

@app.on_event("startup")
async def startup_event():
    """Create database tables when the app starts"""
    try:
        Base.metadata.create_all(engine)
        print("Database tables created successfully")
        
        # Seed initial data if it doesn't exist
        await seed_initial_data()
        
    except Exception as e:
        print(f"Error during startup: {e}")

async def seed_initial_data():
    """Seed initial company and profile data"""
    from sqlalchemy.orm import Session
    from .models import Company, PriceProfile
    
    db = Session(engine)
    try:
        # Check if company already exists
        existing_company = db.query(Company).filter(
            Company.id == COMPANY_ID
        ).first()
        
        if not existing_company:
            # Create company
            company = Company(id=COMPANY_ID, name="Demo Bygg AB")
            db.add(company)
            db.flush()
            
            # Create price profile
            profile = PriceProfile(
                id=os.getenv("PROFILE_ID", "00000000-0000-0000-0000-000000000001"),
                company_id=company.id,
                name="Standard",
                currency="SEK",
                vat_rate=25.00
            )
            db.add(profile)
            db.commit()
            print("✅ Initial data seeded successfully")
        else:
            print("✅ Company already exists, skipping seed")
            
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

@app.get("/")
def root():
    return {"ok": True}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

@app.post("/quotes/calc", response_model=schemas.QuoteOutTotals)
def calc(q: schemas.QuoteIn):
    items = [
        {"unit_price": i.unit_price, "qty": i.qty} for i in q.items
    ]
    subtotal, vat, total = calc_totals(items, q.vat_rate)
    return {"subtotal": subtotal, "vat": vat, "total": total}

@app.post("/quotes")
def create(q: schemas.QuoteIn, db: Session = Depends(get_db)):
    items = [
        {"kind": i.kind, "ref": i.ref, "description": i.description, "qty": i.qty,
         "unit": i.unit, "unit_price": i.unit_price}
        for i in q.items
    ]
    subtotal, vat, total = calc_totals(
        [{"unit_price": i["unit_price"], "qty": i["qty"]} for i in items], q.vat_rate
    )
    quote_id = crud.create_quote(db, company_id=COMPANY_ID, data={
        "customer_name": q.customer_name,
        "project_name": q.project_name,
        "profile_id": q.profile_id,
        "currency": q.currency,
        "subtotal": subtotal,
        "vat": vat,
        "total": total,
        "items": items,
    })
    return {"id": quote_id, "subtotal": subtotal, "vat": vat, "total": total}

@app.post("/quotes/{quote_id}/pdf")
async def generate_pdf(quote_id: str, db: Session = Depends(get_db)):
    """Generate PDF for a specific quote"""
    try:
        print(f"Starting PDF generation for quote: {quote_id}")
        
        # Get quote and related data
        quote = db.query(models.Quote).filter(models.Quote.id == quote_id).first()
        if not quote:
            print(f"Quote not found: {quote_id}")
            raise HTTPException(status_code=404, detail="Quote not found")
        
        print(f"Found quote: {quote.customer_name}")
        
        # Get quote items
        quote_items = db.query(models.QuoteItem).filter(models.QuoteItem.quote_id == quote_id).all()
        print(f"Found {len(quote_items)} quote items")
        
        # Get company info
        company = db.query(models.Company).filter(models.Company.id == quote.company_id).first()
        if not company:
            print(f"Company not found: {quote.company_id}")
            raise HTTPException(status_code=404, detail="Company not found")
        
        print(f"Found company: {company.name}")
        
        # Get VAT rate from price profile
        profile = db.query(models.PriceProfile).filter(models.PriceProfile.id == quote.profile_id).first()
        vat_rate = profile.vat_rate if profile else Decimal("25.0")
        print(f"Using VAT rate: {vat_rate}")
        
        # Render template
        print("Rendering template...")
        template = jinja_env.get_template("quote_template.html")
        html_content = template.render(
            quote=quote,
            quote_items=quote_items,
            company=company,
            vat_rate=vat_rate,
            timedelta=timedelta,
            str=str
        )
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
        return FileResponse(
            tmp_file_path,
            media_type="application/pdf",
            filename=f"offert_{quote_id[:8]}_{quote.customer_name.replace(' ', '_')}.pdf"
        )
        
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")
