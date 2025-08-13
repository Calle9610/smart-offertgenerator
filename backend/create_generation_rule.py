#!/usr/bin/env python3
"""Create a generation rule for bathroom|standard."""

from uuid import uuid4

from app.db import SessionLocal
from app.models import Company, GenerationRule


def create_generation_rule():
    """Create a generation rule for bathroom|standard."""
    db = SessionLocal()
    try:
        # Get the first company (our test company)
        company = db.query(Company).first()
        if not company:
            print("❌ No company found!")
            return

        print(f"🏢 Found company: {company.name} (ID: {company.id})")

        # Create generation rule for bathroom|standard
        rule = GenerationRule(
            id=uuid4(),
            company_id=company.id,
            key="bathroom|standard",
            rules={
                "labor": {
                    "SNICK": "8 + 2*areaM2",
                    "VVS": "hasPlumbingWork ? 6 : 0",
                    "EL": "hasElectricalWork ? 4 : 0",
                },
                "materials": {
                    "KAKEL20": "areaM2 * 1.2",
                    "FOG5": "ceil(areaM2 / 10)",
                    "LIST": "ceil(areaM2 * 0.8)",
                },
            },
        )
        db.add(rule)
        db.commit()

        print(f"✅ Generation rule created successfully!")
        print(f"   Key: {rule.key}")
        print(f"   Company ID: {rule.company_id}")
        print(f"   Rule ID: {rule.id}")
        print(f"   Rules: {rule.rules}")

        return rule.id

    except Exception as e:
        print(f"❌ Error creating generation rule: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_generation_rule()
