"""Importera labor_rates.csv och materials.csv till DB.
Använd: DATABASE_URL env (se backend/README.md) """
import csv, os
from decimal import Decimal
from app.db import SessionLocal, Base, engine
from app.models import LaborRate, Material

Base.metadata.create_all(engine)

LABOR_CSV = os.getenv("LABOR_CSV", "labor_rates.csv")
MATERIALS_CSV = os.getenv("MATERIALS_CSV", "materials.csv")
COMPANY_ID = os.getenv("COMPANY_ID", "00000000-0000-0000-0000-000000000001")
PROFILE_ID = os.getenv("PROFILE_ID", "00000000-0000-0000-0000-000000000001")

def imp_labor(db):
    with open(LABOR_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            db.add(LaborRate(
                company_id=COMPANY_ID,
                profile_id=PROFILE_ID,
                code=row["code"],
                description=row.get("description"),
                unit=row.get("unit", "hour"),
                unit_price=Decimal(row["unit_price"])
            ))
    db.commit()


def imp_materials(db):
    with open(MATERIALS_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            db.add(Material(
                company_id=COMPANY_ID,
                profile_id=PROFILE_ID,
                sku=row.get("sku"),
                name=row["name"],
                unit=row.get("unit", "pcs"),
                unit_cost=Decimal(row["unit_cost"]),
                markup_pct=Decimal(row.get("markup_pct", "20"))
            ))
    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        imp_labor(db)
        imp_materials(db)
        print("Imported labor & materials")
    finally:
        db.close()
