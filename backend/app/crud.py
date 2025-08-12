from sqlalchemy.orm import Session
from . import models
from decimal import Decimal

# Exempel: skapa offert + rader (förenklat, utan relations-validering)

def create_quote(db: Session, company_id, data):
    q = models.Quote(
        company_id=company_id,
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
