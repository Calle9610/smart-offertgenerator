# 🧠 Auto-Tuning v1 - Regelbaserad Autogenerering med Lärande

## 📋 Översikt

Auto-Tuning v1 är ett intelligent system som lär sig från användarjusteringar för att förbättra framtida offertgenerering. Systemet använder mönsterigenkänning för att justera kvantiteter och priser baserat på historisk data.

## 🏗️ Arkitektur

### **Backend-komponenter:**
- **`AutoTuningEngine`** - Huvudmotorn för lärande och justering
- **`QuoteAdjustmentLog`** - Loggar användarjusteringar
- **`AutoTuningPattern`** - Lagrar lärda justeringsmönster
- **Migration 004** - Skapar nya tabeller för auto-tuning

### **Frontend-komponenter:**
- **Auto-tuning Insights Page** - Visar lärande mönster och förbättringsförslag
- **Confidence Indicators** - Visar konfidensnivåer för varje offertrad
- **Adjustment Logging** - Automatisk loggning av användarjusteringar

## 🚀 Användning

### **1. Skapa en offert med auto-generering**

```bash
# Skapa projektkrav
curl -X POST "http://localhost:8000/project-requirements" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "room_type": "bathroom",
    "area_m2": 14,
    "finish_level": "premium",
    "has_plumbing_work": true,
    "has_electrical_work": false,
    "material_prefs": [],
    "site_constraints": [],
    "notes": "Luxury bathroom renovation"
  }'

# Auto-generera offert
curl -X POST "http://localhost:8000/quotes/autogenerate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "requirements_id": "<requirements_id>",
    "profile_id": "<profile_id>"
  }'
```

### **2. Justera offertrad och logga för auto-tuning**

```bash
# Logga användarjustering
curl -X POST "http://localhost:8000/quotes/<quote_id>/adjustments" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "item_ref": "SNICK",
    "item_kind": "labor",
    "original_qty": 8.0,
    "adjusted_qty": 10.0,
    "original_unit_price": 650.00,
    "adjusted_unit_price": 650.00,
    "adjustment_reason": "Behöver mer tid för detaljarbete"
  }'
```

### **3. Hämta auto-tuning insights**

```bash
# Hämta lärande mönster
curl -X GET "http://localhost:8000/auto-tuning/insights" \
  -H "Authorization: Bearer <token>"
```

## 📊 Mönsterformat

### **Pattern Key:**
```
"roomType|finishLevel|itemRef"
```

**Exempel:**
- `"bathroom|premium|SNICK"` - Snickeri för premium badrum
- `"kitchen|standard|KAKEL20"` - Kakel för standard kök
- `"living|basic|MALING"` - Målning för basic vardagsrum

### **Adjustment Factor:**
- **1.0** = Perfekt match (ingen justering behövs)
- **> 1.0** = Systemet underskattar (behöver öka)
- **< 1.0** = Systemet överskattar (behöver minska)

**Exempel:**
- **1.25** = Systemet underskattar med 25%
- **0.8** = Systemet överskattar med 20%

## 🎯 Confidence Scoring

### **Konfidensnivåer:**
- **0.8-1.0** (Grön) - Hög konfidens, mönster är tillförlitligt
- **0.6-0.79** (Gul) - Måttlig konfidens, behöver mer data
- **0.0-0.59** (Röd) - Låg konfidens, mönster är osäkert

### **Konfidens beräknas baserat på:**
- Antal prover (fler prover = högre konfidens)
- Konsistens i justeringar (liknande justeringar = högre konfidens)
- Tid sedan senaste justering (nyare data = högre konfidens)

## 🔄 Auto-Tuning Process

### **1. Justering Loggas**
```
Användare ändrar kvantitet från 8h till 10h för SNICK
→ System loggar justering i QuoteAdjustmentLog
→ Skapar/uppdaterar mönster "bathroom|premium|SNICK"
```

### **2. Mönster Uppdateras**
```
Befintligt mönster: factor=1.0, confidence=0.7, samples=3
Ny justering: factor=1.25 (10/8)
Uppdaterat: factor=1.06, confidence=0.75, samples=4
```

### **3. Framtida Generering**
```
Nästa gång systemet genererar "bathroom|premium|SNICK":
→ Baserat på regel: 8 + 2*areaM2 = 8 + 2*14 = 36h
→ Applicerar auto-tuning: 36 * 1.06 = 38.16h
→ Visar konfidens: 75%
```

## 📈 Förbättringsförslag

Systemet genererar automatiskt förbättringsförslag baserat på data:

### **Låg Konfidens:**
```
"Flera mönster har låg konfidens (3 st). 
Överväg att samla in mer data för dessa kombinationer."
```

### **Extrema Justeringar:**
```
"Flera mönster visar extrema justeringar (2 st). 
Kontrollera grundreglerna för dessa kombinationer."
```

### **Bra Prestanda:**
```
"Systemet lär sig bra från användarjusteringar. 
Fortsätt att använda auto-generering."
```

## 🎨 Frontend Integration

### **Confidence Indicators:**
Varje offertrad visar konfidensnivå baserat på auto-tuning:

```
[Typ] [Beskrivning] [Enhet] [Antal] [Á-pris] [Konfidens] [Åtgärd]
Arbete Snickeri     hour    10     650      75%        Ta bort
```

### **Auto-Tuning Insights Panel:**
```
┌─ Auto-Tuning Insights ──────────────────────────────┐
│ Lärda mönster: 5    Genomsnittlig konfidens: 78%   │
│ Mest justerat: SNICK                                │
│                                                     │
│ 💡 Flera mönster har låg konfidens (2 st)...       │
│ 💡 Systemet lär sig bra från användarjusteringar    │
└─────────────────────────────────────────────────────┘
```

## 🔒 Säkerhet

### **Multi-Tenant Isolation:**
- Alla queries scopes av `company_id`
- Användare kan bara se data från sitt företag
- JWT-validering för alla endpoints

### **Data Validering:**
- Pydantic schemas validerar alla inputs
- SQL injection skyddad via SQLAlchemy
- XSS skyddad via proper escaping

### **Rate Limiting:**
- In-memory cache för tracking pixel
- Deduplicering av "opened" events
- Säkra matematiska operationer (ingen eval)

## 🧪 Testning

### **Backend Tests:**
```bash
cd backend
pytest tests/test_auto_tuning.py -v
```

### **Frontend Tests:**
```bash
cd frontend
npm run test
```

### **Integration Tests:**
```bash
# Testa hela flödet
curl -X POST "http://localhost:8000/quotes/autogenerate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"requirements_id": "...", "profile_id": "..."}'

# Justera och logga
curl -X POST "http://localhost:8000/quotes/<id>/adjustments" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"item_ref": "SNICK", "item_kind": "labor", ...}'

# Hämta insights
curl -X GET "http://localhost:8000/auto-tuning/insights" \
  -H "Authorization: Bearer <token>"
```

## 🚀 Nästa Steg

### **Auto-Tuning v2 (Framtida):**
- **Machine Learning** - Använd ML-modeller för prediktiv justering
- **A/B Testing** - Testa olika justeringsstrategier
- **Seasonal Patterns** - Lär sig säsongsmönster
- **Customer Segmentation** - Olika justeringar för olika kundtyper

### **Förbättringar:**
- **Real-time Updates** - Live uppdateringar av konfidensnivåer
- **Batch Processing** - Bearbeta flera justeringar samtidigt
- **Export/Import** - Dela lärda mönster mellan företag
- **Analytics Dashboard** - Detaljerad statistik och trender

---

**Auto-Tuning v1 ger dig en intelligent grund för att förbättra offertgenerering över tid. Systemet lär sig automatiskt från dina justeringar och blir mer exakt för varje offert du skapar! 🎯** 
