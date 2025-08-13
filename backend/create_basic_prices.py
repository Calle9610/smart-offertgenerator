#!/usr/bin/env python3
"""Create basic labor rates and materials for the price profile."""

from app.db import SessionLocal
from app.models import Company, PriceProfile, LaborRate, Material
from decimal import Decimal

def create_basic_prices():
    """Create basic labor rates and materials."""
    db = SessionLocal()
    try:
        # Get the first company and price profile
        company = db.query(Company).first()
        profile = db.query(PriceProfile).first()
        
        if not company or not profile:
            print("❌ Company or price profile not found!")
            return
        
        print(f"🏢 Company: {company.name}")
        print(f"💰 Price Profile: {profile.name}")
        
        # Create basic labor rates
        labor_rates = [
            LaborRate(
                company_id=company.id,
                profile_id=profile.id,
                code="SNICK",
                description="Snickare",
                unit="hour",
                unit_price=Decimal("650.00")
            ),
            LaborRate(
                company_id=company.id,
                profile_id=profile.id,
                code="VVS",
                description="VVS-arbete",
                unit="hour",
                unit_price=Decimal("750.00")
            ),
            LaborRate(
                company_id=company.id,
                profile_id=profile.id,
                code="EL",
                description="Elektriskt arbete",
                unit="hour",
                unit_price=Decimal("700.00")
            )
        ]
        
        # Create basic materials
        materials = [
            Material(
                company_id=company.id,
                profile_id=profile.id,
                sku="KAKEL20",
                name="Kakel 20x20 cm",
                unit="m2",
                unit_cost=Decimal("180.00"),
                markup_pct=Decimal("20.00")
            ),
            Material(
                company_id=company.id,
                profile_id=profile.id,
                sku="FOG5",
                name="Fogmassa 5kg",
                unit="pcs",
                unit_cost=Decimal("45.00"),
                markup_pct=Decimal("25.00")
            ),
            Material(
                company_id=company.id,
                profile_id=profile.id,
                sku="LIST",
                name="Golvlist",
                unit="m",
                unit_cost=Decimal("35.00"),
                markup_pct=Decimal("30.00")
            )
        ]
        
        # Add all to database
        db.add_all(labor_rates)
        db.add_all(materials)
        db.commit()
        
        print(f"✅ Created {len(labor_rates)} labor rates:")
        for rate in labor_rates:
            print(f"   - {rate.code}: {rate.description} ({rate.unit_price} SEK/{rate.unit})")
        
        print(f"✅ Created {len(materials)} materials:")
        for material in materials:
            print(f"   - {material.sku}: {material.name} ({material.unit_cost} SEK/{material.unit})")
        
    except Exception as e:
        print(f"❌ Error creating prices: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_basic_prices()
