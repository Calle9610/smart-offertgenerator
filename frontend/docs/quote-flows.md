# Quote Flows & Edge Cases

## 📋 Översikt

Detta dokument beskriver användarflödena för offerthantering i Smart Offertgenerator, inklusive edge cases och hur UI:et beter sig vid olika scenarion.

## 🔄 Huvudflöden

### 1. Skapa Ny Offert

```
/quotes/new → Skapa offert → /quotes/[id]/edit
```

**Steg:**
1. Användare besöker `/quotes/new`
2. Fyller i kundnamn, projektnamn och offertrader
3. Klickar "Skapa offert"
4. API-anrop till `POST /api/quotes`
5. **Redirect till `/quotes/[id]/edit`** (redigeringsläge)

**UI-beteende:**
- Formulär laddas med standardvärden
- Submit-knapp visar "Skapar offert..." under loading
- Vid framgång: automatiskt redirect till redigeringssidan
- Vid fel: alert med felmeddelande

### 2. Redigera → Visa

```
/quotes/[id]/edit → "Tillbaka" → /quotes/[id]
```

**Steg:**
1. Användare är på `/quotes/[id]/edit`
2. Klickar "Tillbaka" eller "Avbryt"
3. **Navigerar till `/quotes/[id]** (visningsläge)

**UI-beteende:**
- Formuläret behåller ändringar (inte sparade)
- "Tillbaka" och "Avbryt" fungerar identiskt
- Navigation sker utan bekräftelse

### 3. Lista → Visa/Redigera

```
/quotes → "Visa" → /quotes/[id]
/quotes → "Redigera" → /quotes/[id]/edit
```

**Steg:**
1. Användare är på `/quotes` (offertlista)
2. Klickar "Visa" → navigerar till `/quotes/[id]`
3. Klickar "Redigera" → navigerar till `/quotes/[id]/edit`

**UI-beteende:**
- Hover effects på tabellrader
- Loading states för "Skicka" knappen
- Aria-labels för tillgänglighet

## ⚠️ Edge Cases & UI-beteende

### 1. Saknat ID i API-svar

**Scenario:** `createQuote()` returnerar `{}` eller `{ message: "..." }` utan `id`

**UI-beteende:**
- Console error: "❌ QuoteForm: No quote ID in response"
- Alert: "Kunde inte skapa offert: Inget offert-ID mottaget från API"
- Användare stannar kvar på `/quotes/new`
- Submit-knapp återställs till "Skapa offert"

**Lösning:** API måste returnera `{ id: "..." }`

### 2. 404 - Offert hittades inte

**Scenario:** Användare navigerar till `/quotes/invalid-id` eller `/quotes/invalid-id/edit`

**UI-beteende:**
- **Offertvisning:** Grå ikon + "Offert hittades inte" + "Gå tillbaka"-knapp
- **Redigering:** Samma som ovan
- Console error: "Quote not found"
- Användare kan navigera tillbaka med "Gå tillbaka"-knapp

**Lösning:** Proper 404-hantering med `notFound()` i Next.js

### 3. Nätfel & API-fel

**Scenario:** Backend är nere, CORS-fel, timeout

**UI-beteende:**
- **Skapa offert:** Alert med felmeddelande, stannar kvar på `/quotes/new`
- **Visa offert:** Röd varning + "Kunde inte ladda offert" + "Gå tillbaka"
- **Redigera offert:** Samma som visa + "Försök igen"-knapp
- Console errors med detaljerad felinformation

**Lösning:** Retry-logik och graceful degradation

### 4. Saknad JWT-token

**Scenario:** Användare har inte loggat in eller token har gått ut

**UI-beteende:**
- **Skapa offert:** Alert: "No authentication token found"
- **Visa/redigera:** Redirect till `/` (hemma)
- Console error: "No authentication token found"

**Lösning:** Proper auth-check och redirect till login

### 5. Loading States

**Scenario:** Långsamma API-anrop eller nätverksproblem

**UI-beteende:**
- **Skapa offert:** "Skapar offert..." + disabled submit-knapp
- **Redigera offert:** "Sparar..." + disabled "Spara ändringar"
- **Lista:** Skeleton loading med LoadingSkeleton-komponenter
- **Visa offert:** "Laddar offerter..." med skeleton

**Lösning:** Proper loading states och disabled knappar

### 6. Formulärvalidering

**Scenario:** Användare försöker skicka tomt formulär eller ogiltig data

**UI-beteende:**
- **Tomt kundnamn:** HTML5 validation, submit blockeras
- **Negativa priser:** HTML5 validation, submit blockeras
- **Ogiltig enhet:** Formuläret skickas men backend kan returnera fel

**Lösning:** HTML5 validation + backend validering

## 🔧 Tekniska Detaljer

### API Endpoints

```typescript
// Skapa offert
POST /api/quotes → { id: string, message: string }

// Hämta offert
GET /api/quotes/[id] → QuoteDto

// Uppdatera offert  
PUT /api/quotes/[id] → { id: string, message: string }

// Hämta offertlista
GET /api/quotes → QuoteDto[]
```

### Navigation Patterns

```typescript
// Skapa → Redigera
router.push(`/quotes/${quoteId}/edit`)

// Redigera → Visa
router.push(`/quotes/${quoteId}`)

// Lista → Visa
router.push(`/quotes/${id}`)

// Lista → Redigera
router.push(`/quotes/${id}/edit`)
```

### Error Handling

```typescript
// API-fel
if (!res.ok) {
  const errorText = await res.text()
  throw new Error(`Failed to create quote: ${errorText}`)
}

// Saknat ID
if (!quoteId) {
  throw new Error('Inget offert-ID mottaget från API')
}

// 404
if (res.status === 404) {
  notFound()
}
```

## 📱 Responsiv Design

### Mobile-first Approach

- **Tabell:** Horizontal scroll på små skärmar
- **Formulär:** Stackade kolumner på mobile
- **Knappar:** Fullbredd på mobile, auto-bredd på desktop
- **Navigation:** Touch-friendly knappstorlekar

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

## ♿ Tillgänglighet (A11Y)

### WCAG AA Compliance

- **Semantisk HTML:** Proper table structure med `th`, `td`
- **ARIA-labels:** Beskrivande text för alla knappar
- **Keyboard navigation:** TAB genom alla interaktiva element
- **Focus management:** Synlig focus ring på alla knappar
- **Screen reader:** Korrekt tabellstruktur och beskrivningar

### Testning

```bash
# Lighthouse A11Y audit
npx lighthouse --only-categories=accessibility

# Playwright A11Y tests
npx playwright test --grep="accessibility"
```

## 🧪 Testning

### Playwright Tests

```bash
# Kör alla quote-tester
npx playwright test quote-routes.spec.ts

# Kör specifikt scenario
npx playwright test --grep="Complete quote flow"
```

### Test Coverage

- ✅ **Happy path:** Skapa → redigera → visa → lista
- ✅ **Edge cases:** 404, nätfel, saknat ID
- ✅ **Navigation:** Alla routes och knappar
- ✅ **Formulär:** Validering och felhantering
- ✅ **Loading states:** Skeleton och disabled knappar

## 📚 Relaterade Filer

- `frontend/src/app/quotes/new/page.tsx` - Skapa offert
- `frontend/src/app/quotes/[id]/page.tsx` - Visa offert
- `frontend/src/app/quotes/[id]/edit/page.tsx` - Redigera offert
- `frontend/src/app/quotes/page.tsx` - Offertlista
- `frontend/src/components/QuoteForm.tsx` - Offertformulär
- `frontend/tests/quote-routes.spec.ts` - Playwright-tester
