from decimal import Decimal

def calc_totals(items, vat_rate: Decimal):
    subtotal = sum((i["unit_price"] * i["qty"]) for i in items)
    vat = (subtotal * vat_rate / Decimal("100")).quantize(Decimal("0.01"))
    total = (subtotal + vat).quantize(Decimal("0.01"))
    return subtotal.quantize(Decimal("0.01")), vat, total


def apply_material_markup(unit_cost: Decimal, markup_pct: Decimal) -> Decimal:
    return (unit_cost * (Decimal("1") + markup_pct / Decimal("100"))).quantize(Decimal("0.01"))
