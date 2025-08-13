# Enkel seed som lägger in en Company och PriceProfile
from .db import Base, SessionLocal, engine
from .models import Company, PriceProfile

Base.metadata.create_all(engine)

db = SessionLocal()
try:
    c = Company(name="Demo Bygg AB")
    db.add(c)
    db.flush()
    p = PriceProfile(company_id=c.id, name="Standard", currency="SEK", vat_rate=25.00)
    db.add(p)
    db.commit()
    print("Seeded company+profile")
finally:
    db.close()
