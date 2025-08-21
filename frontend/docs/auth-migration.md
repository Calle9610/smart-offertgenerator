# 🔐 **Auth Migration Guide - localStorage → httpOnly Cookies**

## 📋 **Översikt**

Detta dokument beskriver migreringen från osäkra localStorage-tokens till säkra httpOnly cookies för autentisering. Backend har redan implementerat säkra cookies, men frontend använder fortfarande localStorage på flera ställen.

## 🚨 **Säkerhetsproblem med localStorage**

- **XSS Attack**: localStorage är sårbart för JavaScript-injection
- **Token Exposure**: Tokens kan stjälas av malicious scripts
- **Session Hijacking**: Angripare kan få full åtkomst till användarkonton

## ✅ **Backend Status - REDAN IMPLEMENTERAT**

Backend har redan säkra httpOnly cookies implementerade:
- `backend/app/main.py` - Login endpoints med `httponly=True`
- `backend/app/csrf.py` - CSRF-skydd med cookies
- Alla API-anrop använder redan `credentials: 'include'`

## 🔍 **Komplett Inventering av localStorage-användning**

### **Auth-relaterade localStorage-användningar:**

| Fil | Rad | Vad görs nu | Ny lösning | Prioritet |
|-----|-----|--------------|------------|-----------|
| `frontend/src/app/admin/rules/page.tsx` | 63, 118, 165 | `localStorage.getItem('token')` för Authorization headers | Använd cookies från backend | 🔴 **KRITISK** |
| `frontend/src/app/auto-tuning/page.tsx` | 38, 47 | `localStorage.getItem('token')` + Authorization header | Använd cookies från backend | 🔴 **KRITISK** |
| `frontend/src/app/quotes/new/page.tsx` | 11, 16 | `localStorage.getItem('token')` för state | Använd cookies från backend | 🔴 **KRITISK** |
| `frontend/src/app/quotes/[id]/edit/page.tsx` | 39, 40, 66, 76 | `localStorage.getItem('token')` + Authorization header | Använd cookies från backend | 🔴 **KRITISK** |
| `frontend/src/app/test/page.tsx` | 52 | Authorization header med token från state | Använd cookies från backend | 🟡 **MEDEL** |

### **Icke-auth localStorage-användningar (behåll):**

| Fil | Rad | Vad görs nu | Status |
|-----|-----|--------------|--------|
| `frontend/src/components/ui/ThemeToggle.tsx` | 13, 31, 132, 150 | Tema-sparning | ✅ **BEHÅLL** |
| `frontend/src/app/styleguide/page.tsx` | 59 | Dokumentation av tema | ✅ **BEHÅLL** |

## 🛠️ **Implementationsplan**

### **Steg 1: Uppdatera API-anrop (KRITISKT)**

**Filer att uppdatera:**
- `frontend/src/app/admin/rules/page.tsx`
- `frontend/src/app/auto-tuning/page.tsx`
- `frontend/src/app/quotes/new/page.tsx`
- `frontend/src/app/quotes/[id]/edit/page.tsx`

**Ändringar:**
```typescript
// GAMMALT (osäkert):
const token = localStorage.getItem('token')
const headers = {
  'Authorization': `Bearer ${token}`
}

// NYTT (säkert):
const headers = {} // Cookies skickas automatiskt med credentials: 'include'
```

### **Steg 2: Ta bort token-state (KRITISKT)**

**Filer att uppdatera:**
- `frontend/src/app/quotes/new/page.tsx`
- `frontend/src/app/quotes/[id]/edit/page.tsx`

**Ändringar:**
```typescript
// GAMMALT:
const [token, setToken] = useState<string | null>(null)
const storedToken = localStorage.getItem('token')
if (!storedToken) {
  // Handle missing token
}
setToken(storedToken)

// NYTT:
// Ingen token-state behövs, cookies hanteras automatiskt
```

### **Steg 3: Uppdatera fetch-anrop (KRITISKT)**

**Ändringar:**
```typescript
// GAMMALT:
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// NYTT:
fetch('/api/endpoint', {
  credentials: 'include' // Cookies skickas automatiskt
})
```

## 📝 **Detaljerade Ändringar per Fil**

### **1. `frontend/src/app/admin/rules/page.tsx`**

**Rad 63, 118, 165:**
```typescript
// GAMMALT:
'Authorization': `Bearer ${localStorage.getItem('token')}`

// NYTT:
// Ta bort Authorization header helt, använd credentials: 'include'
```

**Komplett fetch-uppdatering:**
```typescript
const response = await fetch('/api/admin/rules', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Ta bort Authorization header
  },
  credentials: 'include', // Lägg till denna
  body: JSON.stringify(ruleData)
})
```

### **2. `frontend/src/app/auto-tuning/page.tsx`**

**Rad 38:**
```typescript
// GAMMALT:
const token = localStorage.getItem('token')

// NYTT:
// Ta bort token-variabeln helt
```

**Rad 47:**
```typescript
// GAMMALT:
'Authorization': `Bearer ${token}`

// NYTT:
// Ta bort Authorization header, lägg till credentials: 'include'
```

### **3. `frontend/src/app/quotes/new/page.tsx`**

**Rad 6, 11, 16:**
```typescript
// GAMMALT:
const [token, setToken] = useState<string | null>(null)
const storedToken = localStorage.getItem('token')
if (!storedToken) {
  // Handle missing token
}
setToken(storedToken)

// NYTT:
// Ta bort all token-state och localStorage-användning
```

**Rad 28:**
```typescript
// GAMMALT:
if (!token) {
  return <div>Loading...</div>
}

// NYTT:
// Ta bort token-check, cookies hanteras automatiskt
```

### **4. `frontend/src/app/quotes/[id]/edit/page.tsx`**

**Rad 39-41, 66-68:**
```typescript
// GAMMALT:
const token = localStorage.getItem('token')
if (!token) {
  throw new Error('Ingen autentiseringstoken hittad')
}

// NYTT:
// Ta bort token-check, cookies hanteras automatiskt
```

**Rad 76:**
```typescript
// GAMMALT:
'Authorization': `Bearer ${token}`

// NYTT:
// Ta bort Authorization header, lägg till credentials: 'include'
```

## 🔒 **Säkerhetsförbättringar**

### **Före migrering:**
- ❌ Tokens exponerade i localStorage
- ❌ Sårbart för XSS-attacker
- ❌ Manuell token-hantering
- ❌ Risk för token-stöld

### **Efter migrering:**
- ✅ Tokens i säkra httpOnly cookies
- ✅ Skyddat mot XSS-attacker
- ✅ Automatisk cookie-hantering
- ✅ CSRF-skydd implementerat

## 🧪 **Testning**

### **Test-scenarios:**
1. **Login/logout** - Verifiera att cookies sätts/rensas korrekt
2. **API-anrop** - Verifiera att cookies skickas automatiskt
3. **XSS-skydd** - Verifiera att tokens inte kan stjälas via JavaScript
4. **CSRF-skydd** - Verifiera att CSRF-tokens valideras

### **Test-kommandon:**
```bash
# Verifiera att cookies sätts vid login
curl -c cookies.txt -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Verifiera att API-anrop fungerar med cookies
curl -b cookies.txt http://localhost:8000/api/quotes
```

## 📊 **Prioritering**

### **Prioritet 1 (KRITISKT):**
- [ ] `frontend/src/app/admin/rules/page.tsx`
- [ ] `frontend/src/app/auto-tuning/page.tsx`
- [ ] `frontend/src/app/quotes/new/page.tsx`
- [ ] `frontend/src/app/quotes/[id]/edit/page.tsx`

### **Prioritet 2 (MEDEL):**
- [ ] `frontend/src/app/test/page.tsx`

### **Prioritet 3 (LÅG):**
- [ ] Uppdatera dokumentation
- [ ] Lägg till tester

## 🎯 **Definition of Done**

- [ ] Alla localStorage.getItem('token') anrop ersatta
- [ ] Alla Authorization: Bearer headers borttagna
- [ ] Alla fetch-anrop använder credentials: 'include'
- [ ] Token-state variabler borttagna
- [ ] Tester skapade och passerar
- [ ] Dokumentation uppdaterad
- [ ] Code review godkänd

## 📚 **Resurser**

- [Backend CSRF Implementation](../backend/app/csrf.py)
- [Backend Auth Endpoints](../backend/app/main.py)
- [Frontend API Functions](../frontend/src/app/api.ts)
- [Cookie Security Best Practices](https://owasp.org/www-project-cheat-sheets/cheatsheets/HTML5_Security_Cheat_Sheet.html#cookies)

---

*Senast uppdaterad: 2025-08-21*
*Status: Inventering slutförd, implementation pågår*
*Ansvarig: Security Team*
