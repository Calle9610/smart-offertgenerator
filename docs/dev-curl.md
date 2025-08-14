# Development cURL Commands

Detta dokument innehåller cURL-kommandon för att testa alla viktiga endpoints i Smart Offertgenerator systemet.

## 🔐 **Autentisering**

Först måste du logga in och få en JWT token:

```bash
# Logga in och få token
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Spara token i variabel för enklare användning
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Ersätt med din faktiska token
```

## 📋 **1. Skapa Project Requirements**

Skapa projektkrav som systemet ska använda för auto-generering:

```bash
# Skapa project requirements för badrum
curl -X POST "http://localhost:8000/project-requirements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Badrum 6m²",
    "customer_name": "Testkund AB",
    "room_type": "bathroom",
    "finish_level": "standard",
    "area_m2": 15.5,
    "data": {
      "areaM2": 15.5,
      "hasPlumbingWork": 1,
      "hasElectricalWork": 0,
      "roomType": "bathroom",
      "finishLevel": "standard"
    }
  }'

# Spara requirements ID för senare användning
REQ_ID="123e4567-e89b-12d3-a456-426614174000"  # Ersätt med faktiskt ID
```

## 🎯 **2. Auto-generera Offerter**

Använd project requirements för att auto-generera offertrader:

```bash
# Hämta price profile ID först
curl -X GET "http://localhost:8000/price-profiles" \
  -H "Authorization: Bearer $TOKEN"

# Spara profile ID
PROFILE_ID="456e7890-e89b-12d3-a456-426614174000"  # Ersätt med faktiskt ID

# Auto-generera offertrader
curl -X POST "http://localhost:8000/quotes/autogenerate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requirementsId": "'$REQ_ID'",
    "profileId": "'$PROFILE_ID'"
  }'
```

**Förväntat svar:**
```json
{
  "items": [
    {
      "kind": "labor",
      "ref": "SNICK",
      "description": "Snickeri",
      "qty": 39.0,
      "unit": "hour",
      "unit_price": 650.0,
      "line_total": 25350.0
    },
    {
      "kind": "material",
      "ref": "KAKEL20",
      "description": "Kakel 20x20 cm",
      "qty": 18.6,
      "unit": "m2",
      "unit_price": 216.0,
      "line_total": 4017.6
    }
  ],
  "subtotal": 29367.6,
  "vat": 7341.9,
  "total": 36709.5,
  "tuning_applied": [],
  "confidence_per_item": {
    "SNICK": "low",
    "KAKEL20": "low"
  }
}
```

## 🎛️ **3. Hantera Dynamiska Tillval (Option Groups)**

### **3.1 Skapa offert med tillval**

```bash
# Skapa offert med tillval
curl -X POST "http://localhost:8000/quotes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Testkund AB",
    "project_name": "Badrum med tillval",
    "profile_id": "'$PROFILE_ID'",
    "currency": "SEK",
    "vat_rate": 25.0,
    "items": [
      {
        "kind": "labor",
        "description": "Grundläggande snickeri",
        "qty": 20.0,
        "unit": "hour",
        "unit_price": 650.0,
        "is_optional": false
      },
      {
        "kind": "material",
        "description": "Standard kakel",
        "qty": 15.0,
        "unit": "m2",
        "unit_price": 216.0,
        "is_optional": false
      },
      {
        "kind": "labor",
        "description": "Extra detaljarbete",
        "qty": 8.0,
        "unit": "hour",
        "unit_price": 750.0,
        "is_optional": true,
        "option_group": "extra_features"
      },
      {
        "kind": "material",
        "description": "Premium kakel",
        "qty": 15.0,
        "unit": "m2",
        "unit_price": 350.0,
        "is_optional": true,
        "option_group": "materials"
      },
      {
        "kind": "material",
        "description": "Standard kakel",
        "qty": 15.0,
        "unit": "m2",
        "unit_price": 216.0,
        "is_optional": true,
        "option_group": "materials"
      }
    ]
  }'

# Spara offert ID
QUOTE_ID="789e0123-e89b-12d3-a456-426614174000"  # Ersätt med faktiskt ID
```

### **3.2 Hämta tillval för offert**

```bash
# Hämta alla tillval grupperade per kategori
curl -X GET "http://localhost:8000/quotes/$QUOTE_ID/options" \
  -H "Authorization: Bearer $TOKEN"
```

**Förväntat svar:**
```json
{
  "quote_id": "789e0123-e89b-12d3-a456-426614174000",
  "option_groups": [
    {
      "name": "extra_features",
      "title": "Extra funktioner",
      "description": "Lägg till extra funktioner och förbättringar",
      "type": "multiple",
      "items": [
        {
          "id": "item-uuid-1",
          "kind": "labor",
          "description": "Extra detaljarbete",
          "qty": 8.0,
          "unit": "hour",
          "unit_price": 750.0,
          "line_total": 6000.0,
          "is_optional": true,
          "option_group": "extra_features",
          "is_selected": true
        }
      ],
      "selected_items": ["item-uuid-1"]
    },
    {
      "name": "materials",
      "title": "Materialval",
      "description": "Välj materialkvalitet och typ",
      "type": "single",
      "items": [
        {
          "id": "item-uuid-2",
          "kind": "material",
          "description": "Premium kakel",
          "qty": 15.0,
          "unit": "m2",
          "unit_price": 350.0,
          "line_total": 5250.0,
          "is_optional": true,
          "option_group": "materials",
          "is_selected": true
        },
        {
          "id": "item-uuid-3",
          "kind": "material",
          "description": "Standard kakel",
          "qty": 15.0,
          "unit": "m2",
          "unit_price": 216.0,
          "line_total": 3240.0,
          "is_optional": true,
          "option_group": "materials",
          "is_selected": false
        }
      ],
      "selected_items": ["item-uuid-2"]
    }
  ],
  "current_total": 45609.5,
  "base_total": 34350.0
}
```

### **3.3 Uppdatera valda tillval**

```bash
# Välj premium kakel istället för standard
curl -X POST "http://localhost:8000/quotes/$QUOTE_ID/options" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selected_items": ["item-uuid-1", "item-uuid-2"],
    "deselected_items": ["item-uuid-3"]
  }'
```

**Förväntat svar:**
```json
{
  "success": true,
  "new_total": 45609.5,
  "message": "Quote options updated successfully. New total: 45609.50 SEK",
  "updated_items": [
    {
      "id": "item-uuid-1",
      "kind": "labor",
      "description": "Extra detaljarbete",
      "qty": 8.0,
      "unit": "hour",
      "unit_price": 750.0,
      "line_total": 6000.0,
      "is_optional": true,
      "option_group": "extra_features",
      "is_selected": true
    },
    {
      "id": "item-uuid-2",
      "kind": "material",
      "description": "Premium kakel",
      "qty": 15.0,
      "unit": "m2",
      "unit_price": 350.0,
      "line_total": 5250.0,
      "is_optional": true,
      "option_group": "materials",
      "is_selected": true
    }
  ]
}
```

### **3.4 Generera PDF med valda tillval**

```bash
# Generera PDF som matchar exakt vad kunden valt
curl -X POST "http://localhost:8000/quotes/$QUOTE_ID/pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedItemIds": ["item-uuid-1", "item-uuid-2"]
  }' \
  --output "offert_med_tillval.pdf"
```

**PDF innehåller:**
- **Grundarbete & Material** - obligatoriska rader
- **Valda tillval** - endast valda optional-rader
- **Summering** baserad på valen
- **Totals** som matchar kundvyn exakt

## ✏️ **3. Ändra Qty och Spara Quote med sourceItems**

Skapa en offert med de auto-genererade items som sourceItems:

```bash
# Skapa offert med sourceItems för tuning
curl -X POST "http://localhost:8000/quotes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Testkund AB",
    "project_name": "Badrum 6m²",
    "profile_id": "'$PROFILE_ID'",
    "currency": "SEK",
    "vat_rate": 25.0,
    "items": [
      {
        "kind": "labor",
        "ref": "SNICK",
        "description": "Snickeri",
        "qty": 45.0,
        "unit": "hour",
        "unit_price": 650.0
      },
      {
        "kind": "material",
        "ref": "KAKEL20",
        "description": "Kakel 20x20 cm",
        "qty": 20.0,
        "unit": "m2",
        "unit_price": 216.0
      }
    ],
    "source_items": [
      {
        "kind": "labor",
        "ref": "SNICK",
        "description": "Snickeri",
        "qty": 39.0,
        "unit": "hour",
        "unit_price": 650.0
      },
      {
        "kind": "material",
        "ref": "KAKEL20",
        "description": "Kakel 20x20 cm",
        "qty": 18.6,
        "unit": "m2",
        "unit_price": 216.0
      }
    ],
    "room_type": "bathroom",
    "finish_level": "standard"
  }'
```

**Förväntat svar:**
```json
{
  "id": "789e0123-e89b-12d3-a456-426614174000",
  "customer_name": "Testkund AB",
  "project_name": "Badrum 6m²",
  "status": "draft",
  "public_token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "subtotal": 31800.0,
  "vat": 7950.0,
  "total": 39750.0,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Viktigt:** Systemet kommer automatiskt att:
1. Jämföra `qty` mellan `items` och `source_items`
2. Logga ändringar i `quote_adjustment_log` om skillnaden är ≥1%
3. Uppdatera `tuning_stat` med nya faktorer

## 📊 **4. Hämta Tuning Statistics**

Kontrollera hur systemet har lärt sig från dina justeringar:

```bash
# Hämta alla tuning stats för företaget
curl -X GET "http://localhost:8000/auto-tuning/insights" \
  -H "Authorization: Bearer $TOKEN"
```

**Förväntat svar:**
```json
{
  "insights": [
    {
      "key": "bathroom|standard",
      "item_ref": "SNICK",
      "median_factor": 1.154,
      "n": 1,
      "confidence_score": 0.3,
      "interpretation": "Systemet underskattade med 15%",
      "sample_count": 1,
      "last_adjustment": "2024-01-15T10:30:00Z"
    },
    {
      "key": "bathroom|standard",
      "item_ref": "KAKEL20",
      "median_factor": 1.075,
      "n": 1,
      "confidence_score": 0.3,
      "interpretation": "Systemet underskattade med 8%",
      "sample_count": 1,
      "last_adjustment": "2024-01-15T10:30:00Z"
    }
  ],
  "total_patterns": 2,
  "average_confidence": 0.3,
  "most_adjusted_item": "SNICK",
  "improvement_suggestions": [
    "Flera mönster har låg konfidens (2 st). Överväg att samla in mer data för dessa kombinationer."
  ]
}
```

## 🔄 **5. Testa Auto-tuning med Uppdaterade Faktorer**

Skapa en ny offert med samma rumstyp och utförandenivå för att se auto-tuning i aktion:

```bash
# Skapa nya project requirements (samma rumstyp/nivå)
curl -X POST "http://localhost:8000/project-requirements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Badrum 8m²",
    "customer_name": "Testkund CD",
    "room_type": "bathroom",
    "finish_level": "standard",
    "area_m2": 20.0,
    "data": {
      "areaM2": 20.0,
      "hasPlumbingWork": 1,
      "hasElectricalWork": 0,
      "roomType": "bathroom",
      "finishLevel": "standard"
    }
  }'

# Spara nytt requirements ID
NEW_REQ_ID="987e6543-e89b-12d3-a456-426614174000"  # Ersätt med faktiskt ID

# Auto-generera igen (nu med tuning)
curl -X POST "http://localhost:8000/quotes/autogenerate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requirementsId": "'$NEW_REQ_ID'",
    "profileId": "'$PROFILE_ID'"
  }'
```

**Förväntat svar (med tuning applicerat):**
```json
{
  "items": [
    {
      "kind": "labor",
      "ref": "SNICK",
      "description": "Snickeri",
      "qty": 54.16,
      "unit": "hour",
      "unit_price": 650.0,
      "line_total": 35204.0
    }
  ],
  "subtotal": 35204.0,
  "vat": 8801.0,
  "total": 44005.0,
  "tuning_applied": [
    {
      "ref": "SNICK",
      "factor": 1.154
    }
  ],
  "confidence_per_item": {
    "SNICK": "low"
  }
}
```

**Notera:** 
- Original qty: `8+2*20 = 48`
- Med tuning: `48 * 1.154 = 55.392` (clamped till 54.16)
- Tuning factor 1.154 kommer från din tidigare justering

## 🧪 **6. Testa Admin Rules**

Testa generation rules via admin endpoints:

```bash
# Hämta alla generation rules
curl -X GET "http://localhost:8000/admin/rules" \
  -H "Authorization: Bearer $TOKEN"

# Testa en regel utan att spara
curl -X POST "http://localhost:8000/admin/rules/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bathroom|standard",
    "requirementsData": {
      "areaM2": 15.5,
      "hasPlumbingWork": 1,
      "hasElectricalWork": 0
    }
  }'
```

## 📈 **7. Verifiera Tuning Logs**

Kontrollera att alla justeringar har loggats korrekt:

```bash
# Hämta adjustment logs för en specifik offert
curl -X GET "http://localhost:8000/quotes/789e0123-e89b-12d3-a456-426614174000/adjustments" \
  -H "Authorization: Bearer $TOKEN"

# Hämta alla tuning stats för företaget
curl -X GET "http://localhost:8000/auto-tuning/insights" \
  -H "Authorization: Bearer $TOKEN"
```

## 🔍 **8. Debugging och Troubleshooting**

### Kontrollera att tuning faktorer är korrekta:

```bash
# Verifiera att median faktorer är rimliga
curl -X GET "http://localhost:8000/auto-tuning/insights" \
  -H "Authorization: Bearer $TOKEN" | jq '.insights[] | {item_ref, median_factor, n}'
```

### Kontrollera adjustment logs:

```bash
# Se alla justeringar för ett specifikt item
curl -X GET "http://localhost:8000/quotes/789e0123-e89b-12d3-a456-426614174000/adjustments" \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.item_ref == "SNICK")'
```

## 📝 **9. Komplett Test Workflow**

Här är en komplett sekvens för att testa hela systemet:

```bash
#!/bin/bash

# 1. Logga in
TOKEN=$(curl -s -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | jq -r '.access_token')

echo "Token: $TOKEN"

# 2. Skapa project requirements
REQ_RESPONSE=$(curl -s -X POST "http://localhost:8000/project-requirements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Test Badrum",
    "customer_name": "Testkund",
    "room_type": "bathroom",
    "finish_level": "standard",
    "area_m2": 15.5,
    "data": {
      "areaM2": 15.5,
      "hasPlumbingWork": 1,
      "hasElectricalWork": 0
    }
  }')

REQ_ID=$(echo $REQ_RESPONSE | jq -r '.id')
echo "Requirements ID: $REQ_ID"

# 3. Hämta price profile
PROFILE_RESPONSE=$(curl -s -X GET "http://localhost:8000/price-profiles" \
  -H "Authorization: Bearer $TOKEN")

PROFILE_ID=$(echo $PROFILE_RESPONSE | jq -r '.[0].id')
echo "Profile ID: $PROFILE_ID"

# 4. Auto-generera offert
AUTO_RESPONSE=$(curl -s -X POST "http://localhost:8000/quotes/autogenerate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requirementsId": "'$REQ_ID'",
    "profileId": "'$PROFILE_ID'"
  }')

echo "Auto-generated items:"
echo $AUTO_RESPONSE | jq '.items[] | {ref, qty, unit_price, line_total}'

# 5. Skapa offert med sourceItems
QUOTE_RESPONSE=$(curl -s -X POST "http://localhost:8000/quotes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Testkund",
    "project_name": "Test Badrum",
    "profile_id": "'$PROFILE_ID'",
    "items": [
      {
        "kind": "labor",
        "ref": "SNICK",
        "description": "Snickeri",
        "qty": 45.0,
        "unit": "hour",
        "unit_price": 650.0
      }
    ],
    "source_items": [
      {
        "kind": "labor",
        "ref": "SNICK",
        "description": "Snickeri",
        "qty": 39.0,
        "unit": "hour",
        "unit_price": 650.0
      }
    ],
    "room_type": "bathroom",
    "finish_level": "standard"
  }')

QUOTE_ID=$(echo $QUOTE_RESPONSE | jq -r '.id')
echo "Quote ID: $QUOTE_ID"

# 6. Vänta lite och hämta tuning insights
sleep 2

TUNING_RESPONSE=$(curl -s -X GET "http://localhost:8000/auto-tuning/insights" \
  -H "Authorization: Bearer $TOKEN")

echo "Tuning insights:"
echo $TUNING_RESPONSE | jq '.insights[] | {item_ref, median_factor, n, interpretation}'

echo "Test workflow completed!"
```

## 🌐 **PUBLIKA ENDPOINTS (Ingen autentisering krävs)**

### **1. Visa Publik Offert**

```bash
# Hämta offert via publikt token
curl -X GET "http://localhost:8000/public/quotes/abc123def456" \
  -H "Content-Type: application/json"
```

**Förväntat svar:**
```json
{
  "company_name": "Testföretag AB",
  "project_name": "Badrumsrenovering",
  "customer_name": "Testkund AB",
  "currency": "SEK",
  "items": [
    {
      "kind": "labor",
      "description": "Snickeri",
      "qty": 20.0,
      "unit": "hour",
      "unit_price": 650.0,
      "line_total": 13000.0,
      "is_optional": false
    },
    {
      "kind": "material",
      "description": "Premium kakel",
      "qty": 15.0,
      "unit": "m2",
      "unit_price": 350.0,
      "line_total": 5250.0,
      "is_optional": true,
      "option_group": "materials"
    }
  ],
  "subtotal": 18250.0,
  "vat": 4562.5,
  "total": 22812.5,
  "packages": [],
  "accepted_package_id": null
}
```

### **2. Uppdatera Tillval (Realtid)**

```bash
# Uppdatera valda tillval och få nya totals
curl -X POST "http://localhost:8000/public/quotes/abc123def456/update-selection" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedItemIds": ["item-uuid-1", "item-uuid-3"]
  }'
```

**Förväntat svar:**
```json
{
  "items": [
    {
      "id": "item-uuid-1",
      "kind": "labor",
      "description": "Snickeri",
      "qty": 20.0,
      "unit": "hour",
      "unit_price": 650.0,
      "line_total": 13000.0,
      "is_optional": false,
      "option_group": null,
      "isSelected": true
    },
    {
      "id": "item-uuid-2",
      "kind": "material",
      "description": "Premium kakel",
      "qty": 15.0,
      "unit": "m2",
      "unit_price": 350.0,
      "line_total": 5250.0,
      "is_optional": true,
      "option_group": "materials",
      "isSelected": true
    },
    {
      "id": "item-uuid-3",
      "kind": "material",
      "description": "Extra detaljarbete",
      "qty": 8.0,
      "unit": "hour",
      "unit_price": 750.0,
      "line_total": 6000.0,
      "is_optional": true,
      "option_group": "extra_features",
      "isSelected": true
    }
  ],
  "subtotal": 24250.0,
  "vat": 6062.5,
  "total": 30312.5,
  "base_subtotal": 13000.0,
  "optional_subtotal": 11250.0,
  "selected_item_count": 2,
  "message": "Quote selection updated successfully. New total: 30312.50 SEK"
}
```

### **3. Acceptera Offert**

```bash
# Acceptera offert (idempotent)
curl -X POST "http://localhost:8000/public/quotes/abc123def456/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "package-uuid-1"
  }'
```

**Förväntat svar:**
```json
{
  "message": "Quote accepted successfully with package: Premium",
  "status": "ACCEPTED",
  "quote_id": "quote-uuid-1",
  "package_id": "package-uuid-1",
  "package_name": "Premium"
}
```

### **4. Avböj Offert**

```bash
# Avböj offert (idempotent)
curl -X POST "http://localhost:8000/public/quotes/abc123def456/decline" \
  -H "Content-Type: application/json"
```

**Förväntat svar:**
```json
{
  "message": "Quote declined successfully",
  "status": "DECLINED"
}
```

## 🔐 **AUTENTISERADE ENDPOINTS**

## ⚠️ **Viktiga Noter**

1. **Token hantering:** JWT tokens har en begränsad livslängd. Om du får 401-fel, logga in igen.

2. **UUID format:** Alla ID:n måste vara giltiga UUID:er. Använd de som returneras från API:et.

3. **Tuning tröskel:** Endast justeringar ≥1% loggas för tuning.

4. **Confidence levels:** 
   - `low`: n < 3
   - `med`: 3 ≤ n < 10  
   - `high`: n ≥ 10

5. **Factor clamping:** Tuning faktorer begränsas till [0.8, 1.2] för stabilitet.

6. **Multi-tenancy:** Alla endpoints är company-scoped baserat på användarens JWT token.

## 🚀 **Nästa Steg**

Efter att du har testat detta workflow kan du:

1. **Skapa fler generation rules** för olika rumstyper och utförandenivåer
2. **Testa med olika project requirements** för att se hur systemet lär sig
3. **Analysera tuning patterns** för att förbättra grundreglerna
4. **Implementera frontend integration** med admin rules sidan

Lycka till med testningen! 🎯 
