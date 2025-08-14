# Microcopy QA - Smart Offertgenerator

## 📋 Översikt
Detta dokument listar alla filer som har konverterats till att använda den centrala `sv.ts` filen, vilka kategorier som används var, och återstående arbete.

## ✅ Konverterade filer

### 1. `frontend/src/app/quotes/page.tsx`
- **Status**: ✅ Konverterad
- **Använda kategorier**: `actions.*`, `common.*`
- **Ersatta strängar**: 11 st
- **Exempel**: "Skapa offert" → `copy.actions.create`, "Sök" → `copy.actions.search`

### 2. `frontend/src/components/QuoteForm.tsx`
- **Status**: ✅ Konverterad
- **Använda kategorier**: `actions.*`, `common.*`
- **Ersatta strängar**: 29 st
- **Exempel**: "Kund & Projekt" → `copy.common.customerAndProject`, "Skapa offert" → `copy.actions.createQuote`

### 3. `frontend/src/app/public/quote/[token]/page.tsx`
- **Status**: ✅ Konverterad
- **Använda kategorier**: `actions.*`, `common.*`
- **Ersatta strängar**: 18 st
- **Exempel**: "Offert" → `copy.common.quote.title`, "Acceptera" → `copy.actions.accept`

### 4. `frontend/src/components/system/usePromiseState.ts`
- **Status**: ✅ Konverterad
- **Använda kategorier**: `errors.*`
- **Ersatta strängar**: 2 st
- **Exempel**: "Request cancelled" → `copy.errors.requestCancelled`

### 5. `frontend/src/components/system/ErrorState.tsx`
- **Status**: ✅ Konverterad
- **Använda kategorier**: `errors.*`, `states.*`
- **Ersatta strängar**: 5 st
- **Exempel**: "Försök igen" → `copy.states.retry.title`

## 🗂️ Kategorianvändning per fil

### `sv.common.*`
- **quotes/page.tsx**: Kund/projekt-rubriker, sök/filter-labels
- **QuoteForm.tsx**: Sektionstitlar, fältetiketter, sammanfattningstexter
- **public/quote/page.tsx**: Hero-rubriker, paketbeskrivningar, info-sektioner
- **ErrorState.tsx**: Standard felrubriker

### `sv.actions.*`
- **quotes/page.tsx**: Knapptexter (Skapa, Uppdatera, Visa, Redigera, Skicka)
- **QuoteForm.tsx**: Åtgärdsknappar, undo/redo, lägg till rad
- **public/quote/page.tsx**: Acceptera-knappar, kontaktknappar
- **ErrorState.tsx**: Retry-knappar

### `sv.states.*`
- **ErrorState.tsx**: Loading-text, retry-text
- **usePromiseState.ts**: Felmeddelanden för avbrutna förfrågningar

### `sv.errors.*`
- **ErrorState.tsx**: Standard felmeddelanden, felinformation
- **usePromiseState.ts**: Avbrutna förfrågningar

## 🔄 Återstående arbete

### 1. `frontend/src/components/system/LoadingSkeleton.tsx`
- **Hårdkodade strängar**: "Laddar..." (rad 15)
- **Bör ersättas med**: `copy.states.loading.title`
- **Prioritet**: Medium

### 2. `frontend/src/components/system/EmptyState.tsx`
- **Hårdkodade strängar**: 
  - "Inga offerter än" (rad 45)
  - "Inga kunder än" (rad 50)
  - "Inget innehåll" (rad 55)
- **Bör ersättas med**: `copy.states.empty.title`
- **Prioritet**: Medium

### 3. `frontend/src/components/QuoteForm.tsx` (återstående)
- **Hårdkodade strängar**:
  - "Beskrivning krävs" (Zod schema)
  - "Antal måste vara större än 0" (Zod schema)
  - "Enhet krävs" (Zod schema)
- **Bör ersättas med**: `copy.errors.validation`
- **Prioritet**: Low

### 4. `frontend/src/app/public/quote/[token]/page.tsx` (återstående)
- **Hårdkodade strängar**:
  - "Komplett projektplanering" (paketfeatures)
  - "Kvalificerade hantverkare" (paketfeatures)
  - "Materialgaranti" (paketfeatures)
- **Bör ersättas med**: `copy.common.packageFeatures.*`
- **Prioritet**: Low

### 5. `frontend/src/components/Toast.tsx`
- **Hårdkodade strängar**: 
  - "Stäng" (stängknapp)
  - "×" (stängsymbol)
- **Bör ersättas med**: `copy.actions.close`
- **Prioritet**: Low

### 6. `frontend/src/components/StatusChip.tsx`
- **Hårdkodade strängar**: Status-labels som "Aktiv", "Inaktiv"
- **Bör ersättas med**: `copy.states.*`
- **Prioritet**: Low

### 7. `frontend/src/components/LoginForm.tsx`
- **Hårdkodade strängar**: 
  - "Logga in" (rubrik)
  - "E-post" (label)
  - "Lösenord" (label)
- **Bör ersättas med**: `copy.common.*`, `copy.actions.*`
- **Prioritet**: Medium

### 8. `frontend/src/components/Header.tsx`
- **Hårdkodade strängar**: Navigationslänkar, användarmenyn
- **Bör ersättas med**: `copy.common.navigation.*`
- **Prioritet**: Low

### 9. `frontend/src/app/dashboard/page.tsx`
- **Hårdkodade strängar**: Dashboard-rubriker, statistik-labels
- **Bör ersättas med**: `copy.common.dashboard.*`
- **Prioritet**: Low

### 10. `frontend/src/app/settings/page.tsx`
- **Hårdkodade strängar**: Inställningsrubriker, formulärlabels
- **Bör ersättas med**: `copy.common.settings.*`
- **Prioritet**: Low

## 📊 Statistik

- **Totalt konverterade filer**: 5
- **Totalt ersatta strängar**: 65+
- **Använda kategorier**: 4/4 (100%)
- **Återstående filer att konvertera**: 10+

## 🎯 Nästa steg

1. **Prioritera systemkomponenter** (LoadingSkeleton, EmptyState)
2. **Konvertera återstående UI-komponenter** (Toast, StatusChip)
3. **Lägg till saknade nycklar** i `sv.ts` för återstående strängar
4. **Skapa konverteringsguide** för utvecklare
5. **Implementera automatisk validering** att alla nya komponenter använder `sv.ts`

## 📝 Anteckningar

- Alla nya komponenter ska använda `useCopy()` hook
- Håll svenska texter korta, sakliga och vänliga
- Använd konsekvent namngivning för nycklar
- Testa att alla språkändringar fungerar korrekt
