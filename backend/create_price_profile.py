#!/usr/bin/env python3
"""Create a price profile for the test company."""

from app.db import SessionLocal
from app.models import Company, PriceProfile
from uuid import uuid4

def create_price_profile():
    """Create a price profile for the test company."""
    db = SessionLocal()
    try:
        # Get the first company (our test company)
        company = db.query(Company).first()
        if not company:
            print("❌ No company found! Create a user first.")
            return
        
        print(f"🏢 Found company: {company.name} (ID: {company.id})")
        
        # Create price profile
        profile = PriceProfile(
            id=uuid4(),
            company_id=company.id,
            name="Standard",
            currency="SEK",
            vat_rate=25.00
        )
        db.add(profile)
        db.commit()
        
        print(f"✅ Price profile created successfully!")
        print(f"   Name: {profile.name}")
        print(f"   Currency: {profile.currency}")
        print(f"   VAT Rate: {profile.vat_rate}%")
        print(f"   Profile ID: {profile.id}")
        
        return profile.id
        
    except Exception as e:
        print(f"❌ Error creating price profile: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_price_profile() 
