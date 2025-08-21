# 🐛 **BUG_TRIAGE.md** - Smart Offertgenerator

## 📋 **Bug Prioritization Matrix**

| ID | Titel | Repro | Root Cause Hypotes | Fix-fil(er) | Risk | Status |
|----|-------|-------|-------------------|-------------|------|---------|
| **BUG-001** | **JWT Token Insecure Storage** | Användare loggar in → token sparas i localStorage → XSS attack kan stjäla token | localStorage är sårbart för XSS-attacker, ingen token refresh/expiry | `frontend/src/components/LoginForm.tsx`<br>`frontend/src/components/Header.tsx`<br>`frontend/src/components/IntakeWizard.tsx` | **KRITISK** | 🔴 **OPEN** |
| **BUG-002** | **Missing Input Validation in QuoteForm** | Användare skapar offert med ogiltig data → API-anrop misslyckas → alert() istället för proper error handling | Ingen client-side validering, alert() för error handling | `frontend/src/components/QuoteForm.tsx`<br>`frontend/src/types/quote.ts` | **HÖG** | 🔴 **OPEN** |
| **BUG-003** | **useErrorHandler Syntax Error** | TypeScript compilation error → app kraschar vid runtime | Syntax error i error handling logic | `frontend/src/components/system/useErrorHandler.ts` | **HÖG** | 🔴 **OPEN** |
| **BUG-004** | **Missing Error Boundaries** | React component error → hela app kraschar → ingen graceful degradation | ErrorBoundary inte implementerad på alla sidor | `frontend/src/components/system/ErrorBoundary.tsx`<br>`frontend/src/app/layout.tsx` | **MEDEL** | 🟡 **OPEN** |
| **BUG-005** | **Database Connection Leaks** | Många API-anrop → database sessions stängs inte korrekt → connection pool exhaustion | `finally` block saknas i flera API endpoints | `backend/app/main.py`<br>`backend/app/crud.py` | **MEDEL** | 🟡 **OPEN** |
| **BUG-006** | **Missing Rate Limiting** | Användare kan spam API-anrop → DoS attack möjlig → backend overload | Ingen rate limiting implementerad | `backend/app/main.py`<br>`backend/app/middleware/` | **MEDEL** | 🟡 **OPEN** |
| **BUG-007** | **Insecure Rule Evaluation** | Admin skapar custom rules → potential code injection → security breach | Rule evaluator tillåter potentiellt farliga operationer | `backend/app/rule_evaluator.py` | **HÖG** | 🔴 **OPEN** |
| **BUG-008** | **Missing CSRF Protection** | Användare kan utsättas för CSRF-attacker → unauthorized actions → data breach | Ingen CSRF token validation | `frontend/src/app/api/`<br>`backend/app/main.py` | **HÖG** | 🔴 **OPEN** |
| **BUG-009** | **Error State Memory Leaks** | Långa error states → useEffect cleanup saknas → memory leaks | useEffect dependencies och cleanup saknas | `frontend/src/components/system/ErrorState.tsx` | **LÅG** | 🟢 **OPEN** |
| **BUG-010** | **Missing Input Sanitization** | Användare kan injecta HTML/JS → XSS attack → security breach | Ingen input sanitization på user inputs | `frontend/src/components/`<br>`backend/app/schemas.py` | **HÖG** | 🔴 **OPEN** |

---

## 🚨 **KRITISKA BUGGAR (P0)**

### **BUG-001: JWT Token Insecure Storage**
**Beskrivning:** JWT tokens sparas i localStorage vilket är sårbart för XSS-attacker.

**Repro Steps:**
1. Logga in som användare
2. Token sparas i localStorage
3. XSS attack kan stjäla token
4. Angripare får full åtkomst till användarens konto

**Root Cause:** localStorage är inte säkert för känslig data, ingen token refresh/expiry implementerad.

**Fix-filer:**
- `frontend/src/components/LoginForm.tsx`
- `frontend/src/components/Header.tsx` 
- `frontend/src/components/IntakeWizard.tsx`
- Implementera httpOnly cookies + token refresh

**Risk:** **KRITISK** - Full account compromise möjlig

---

## 🔴 **HÖGA BUGGAR (P1)**

### **BUG-002: Missing Input Validation in QuoteForm**
**Beskrivning:** QuoteForm saknar client-side validering och använder alert() för error handling.

**Repro Steps:**
1. Gå till /quotes/new
2. Fyll i ogiltig data (negativa priser, tomma fält)
3. Klicka "Skapa offert"
4. Alert() visas istället för proper error handling

**Root Cause:** Ingen Zod schema validation, alert() för error handling.

**Fix-filer:**
- `frontend/src/components/QuoteForm.tsx`
- `frontend/src/types/quote.ts`
- Lägg till Zod validation + ErrorState

**Risk:** **HÖG** - Poor UX, data corruption möjlig

### **BUG-003: useErrorHandler Syntax Error**
**Beskrivning:** Syntax error i useErrorHandler orsakar compilation failure.

**Repro Steps:**
1. Kör `npm run typecheck`
2. Syntax error i useErrorHandler.ts
3. App kraschar vid runtime

**Root Cause:** Syntax error i error handling logic.

**Fix-filer:**
- `frontend/src/components/system/useErrorHandler.ts`
- Korrigera syntax error

**Risk:** **HÖG** - App kraschar vid runtime

### **BUG-007: Insecure Rule Evaluation**
**Beskrivning:** Rule evaluator tillåter potentiellt farliga operationer.

**Repro Steps:**
1. Admin skapar custom rules
2. Potential code injection möjlig
3. Security breach risk

**Root Cause:** Rule evaluator inte tillräckligt restriktiv.

**Fix-filer:**
- `backend/app/rule_evaluator.py`
- Implementera sandboxed evaluation

**Risk:** **HÖG** - Security breach möjlig

### **BUG-008: Missing CSRF Protection**
**Beskrivning:** Ingen CSRF token validation implementerad.

**Repro Steps:**
1. Användare loggar in
2. Besöker malicious site
3. CSRF attack kan utföra unauthorized actions

**Root Cause:** Ingen CSRF protection implementerad.

**Fix-filer:**
- `frontend/src/app/api/`
- `backend/app/main.py`
- Implementera CSRF tokens

**Risk:** **HÖG** - Unauthorized actions möjliga

### **BUG-010: Missing Input Sanitization**
**Beskrivning:** Ingen input sanitization på user inputs.

**Repro Steps:**
1. Användare skriver HTML/JS i input fält
2. XSS attack möjlig
3. Security breach risk

**Root Cause:** Ingen input sanitization implementerad.

**Fix-filer:**
- `frontend/src/components/`
- `backend/app/schemas.py`
- Implementera input sanitization

**Risk:** **HÖG** - XSS attack möjlig

---

## 🟡 **MEDEL BUGGAR (P2)**

### **BUG-004: Missing Error Boundaries**
**Beskrivning:** ErrorBoundary inte implementerad på alla sidor.

**Repro Steps:**
1. React component error uppstår
2. Hela app kraschar
3. Ingen graceful degradation

**Root Cause:** ErrorBoundary inte implementerad på alla sidor.

**Fix-filer:**
- `frontend/src/components/system/ErrorBoundary.tsx`
- `frontend/src/app/layout.tsx`
- Implementera global ErrorBoundary

**Risk:** **MEDEL** - Poor error handling

### **BUG-005: Database Connection Leaks**
**Beskrivning:** Database sessions stängs inte korrekt.

**Repro Steps:**
1. Många API-anrop
2. Database sessions stängs inte
3. Connection pool exhaustion

**Root Cause:** `finally` block saknas i flera API endpoints.

**Fix-filer:**
- `backend/app/main.py`
- `backend/app/crud.py`
- Lägg till proper cleanup

**Risk:** **MEDEL** - Database performance issues

### **BUG-006: Missing Rate Limiting**
**Beskrivning:** Ingen rate limiting implementerad.

**Repro Steps:**
1. Användare kan spam API-anrop
2. DoS attack möjlig
3. Backend overload

**Root Cause:** Ingen rate limiting implementerad.

**Fix-filer:**
- `backend/app/main.py`
- `backend/app/middleware/`
- Implementera rate limiting

**Risk:** **MEDEL** - DoS attack möjlig

---

## 🟢 **LÅGA BUGGAR (P3)**

### **BUG-009: Error State Memory Leaks**
**Beskrivning:** useEffect cleanup saknas i ErrorState.

**Repro Steps:**
1. Långa error states
2. useEffect cleanup saknas
3. Memory leaks

**Root Cause:** useEffect dependencies och cleanup saknas.

**Fix-filer:**
- `frontend/src/components/system/ErrorState.tsx`
- Lägg till proper cleanup

**Risk:** **LÅG** - Memory leaks

---

## 📊 **Prioritering och Status**

### **Prioritet 0 (KRITISK)**
- **BUG-001** - JWT Token Insecure Storage

### **Prioritet 1 (HÖG)**
- **BUG-002** - Missing Input Validation
- **BUG-003** - useErrorHandler Syntax Error
- **BUG-007** - Insecure Rule Evaluation
- **BUG-008** - Missing CSRF Protection
- **BUG-010** - Missing Input Sanitization

### **Prioritet 2 (MEDEL)**
- **BUG-004** - Missing Error Boundaries
- **BUG-005** - Database Connection Leaks
- **BUG-006** - Missing Rate Limiting

### **Prioritet 3 (LÅG)**
- **BUG-009** - Error State Memory Leaks

---

## 🎯 **Rekommenderad Åtgärdordning**

1. **Vecka 1:** BUG-001 (JWT Security)
2. **Vecka 2:** BUG-002, BUG-003 (Validation + Error Handling)
3. **Vecka 3:** BUG-007, BUG-008 (Security)
4. **Vecka 4:** BUG-010 (Input Sanitization)
5. **Vecka 5:** BUG-004, BUG-005 (Error Handling + Database)
6. **Vecka 6:** BUG-006, BUG-009 (Rate Limiting + Memory)

---

## 📝 **Noteringar**

- **Security bugs** (BUG-001, BUG-007, BUG-008, BUG-010) måste fixas före production
- **Error handling bugs** (BUG-002, BUG-003, BUG-004) påverkar användarupplevelsen
- **Performance bugs** (BUG-005, BUG-006, BUG-009) påverkar skalbarheten
- Alla fixes ska inkludera tester för att förhindra regression

---

*Senast uppdaterad: 2024-01-15*
*Ansvarig: PM/QA Team*
