# 🚀 Dev cURL Examples

Exempel-curl-kommandon för att testa hela flödet end-to-end.

## ⚠️ Kända problem

**Endpoint 4 (GET /quotes/{id}/adjustments) fungerar inte korrekt:**
- Returnerar alltid tom array `[]`
- Adjustments sparas inte i backend
- Detta är ett känt problem som behöver fixas

**Endpoints 1-3 fungerar korrekt** och kan användas för testning.

## 🔑 Autentisering

Först behöver du en JWT-token. Sätt denna som miljövariabel:

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInRlbmFudF9pZCI6IjY4ODgzZjUyLTMzY2EtNDBjOS04YWQzLWE0OTUyZTBmYmJmMiIsImV4cCI6MTc1NTA3MTE5OX0.b4vyDymoriaR8uPv1HCYbDHum9oxdwXLw-YBpLgPeFc"
```

**Alternativt, hämta en ny token:**
```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

## 📋 1. Skapa projektkrav (Requirements)

### POST /project-requirements

```bash
curl -X POST "http://localhost:8000/project-requirements" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_type": "bathroom",
    "area_m2": 6,
    "finish_level": "standard",
    "has_plumbing_work": true,
    "has_electrical_work": false,
    "material_prefs": ["kakel", "dusch"],
    "site_constraints": ["begränsat utrymme"],
    "notes": "Renovering av badrum med kakel, dusch och handfat"
  }'
```

**Exempel-svar:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "quote_id": null,
  "data": {
    "room_type": "bathroom",
    "area_m2": 6.0,
    "finish_level": "standard",
    "has_plumbing_work": true,
    "has_electrical_work": false,
    "material_prefs": ["kakel", "dusch"],
    "site_constraints": ["begränsat utrymme"],
    "notes": "Renovering av badrum med kakel, dusch och handfat"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 🤖 2. Auto-generera offert från krav

### POST /quotes/autogenerate

```bash
curl -X POST "http://localhost:8000/quotes/autogenerate" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requirements_id": "61ea8ed7-78cc-427f-ad5e-9c62cd4c85a1",
    "profile_id": "b0019524-77b6-48e0-9a41-1a48cd422af7"
  }'
```

**Exempel-svar:**
```json
{
  "items": [
    {
      "kind": "labor",
      "ref": "EL",
      "description": "Labor: EL (rate not found)",
      "qty": 0.0,
      "unit": "hour",
      "unit_price": 0.0,
      "line_total": 0.0,
      "confidence_per_item": 0.3
    },
    {
      "kind": "labor",
      "ref": "VVS",
      "description": "Labor: VVS (rate not found)",
      "qty": 6.0,
      "unit": "hour",
      "unit_price": 0.0,
      "line_total": 0.0,
      "confidence_per_item": 0.3
    }
  ],
  "subtotal": 0.0,
  "vat": 0.0,
  "total": 0.0,
  "confidence_per_item": [0.3, 0.3]
}
```

**Notera:** Priser är 0 eftersom labor rates och materials inte är konfigurerade än. Detta är normalt för en ny installation.

## ✏️ 3. Skapa offert med justerade rader

### POST /quotes

```bash
curl -X POST "http://localhost:8000/quotes" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Testkund AB",
    "project_name": "Badrum 6 m²",
    "profile_id": "b0019524-77b6-48e0-9a41-1a48cd422af7",
    "currency": "SEK",
    "vat_rate": 25,
    "items": [
      {
        "kind": "labor",
        "description": "Snickeri",
        "unit": "hour",
        "qty": 8,
        "unit_price": 650
      },
      {
        "kind": "material",
        "description": "Kakel 20x20",
        "unit": "m2",
        "qty": 20,
        "unit_price": 216
      }
    ],
    "source_items": [
      {
        "originalQty": 8,
        "newQty": 10,
        "description": "Snickeri",
        "kind": "labor",
        "adjustment": 2,
        "adjustmentPercent": 25
      }
    ],
    "aiSections": {
      "summary": "Badrumsrenovering",
      "assumptions": "Standard utförande",
      "exclusions": "Möbler",
      "timeline": "4 veckor"
    }
  }'
```

**Exempel-svar:**
```json
{
  "id": "6c0d058b-f64f-40fe-aeed-02199cb6351f",
  "subtotal": 9520.0,
  "vat": 2380.0,
  "total": 11900.0
}
```

## 📊 4. Hämta ändringslogg för offert

### GET /quotes/{id}/adjustments

```bash
curl -X GET "http://localhost:8000/quotes/6c0d058b-f64f-40fe-aeed-02199cb6351f/adjustments" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Exempel-svar:**
```json
[]
```

**Notera:** Just nu returneras en tom array eftersom adjustments inte sparas korrekt i backend. Detta är ett känt problem som behöver fixas.

## 🔍 Extra endpoints för testning

### Hämta alla offerter för företag

```bash
curl -X GET "http://localhost:8000/quotes" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Hämta specifik offert

```bash
curl -X GET "http://localhost:8000/quotes/def67890-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Hämta prisprofiler

```bash
curl -X GET "http://localhost:8000/price-profiles" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 🚨 Felhantering

### 401 Unauthorized (felaktig JWT)
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found (felaktigt ID)
```json
{
  "detail": "Quote not found"
}
```

### 422 Validation Error (felaktig data)
```json
{
  "detail": [
    {
      "loc": ["body", "customer_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## 💡 Tips för testning

1. **Spara requirements_id** från steg 1 för att använda i steg 2
2. **Spara quote_id** från steg 2 för att använda i steg 4
3. **Använd `jq`** för att formatera JSON-svar:
   ```bash
   curl ... | jq '.'
   ```
4. **Sätt breakpoints** i frontend för att se exakt vad som skickas
5. **Kontrollera Network-tab** i DevTools för att se alla requests

## 🔧 Miljövariabler för enkel testning

```bash
# Sätt i din .bashrc eller .zshrc
export API_BASE="http://localhost:8000"
export JWT_TOKEN="din-jwt-token-här"

# Använd sedan så här:
curl -X GET "$API_BASE/quotes" -H "Authorization: Bearer $JWT_TOKEN"
``` 
