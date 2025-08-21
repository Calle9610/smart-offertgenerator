# 🔐 **Server-Side Session Documentation**

## 📋 **Översikt**

Server-side session-hantering implementerad för att skydda sidor utan att använda localStorage. Användardata hämtas på servern via cookies och skickas till klienten via AuthContext.

## ✨ **Funktioner**

- ✅ **Server-side session**: Läser cookies och fetchar `/users/me` på servern
- ✅ **SSR integration**: Session kontrolleras innan sidan renderas
- ✅ **Route-baserad auth**: Automatisk skydd av skyddade rutter
- ✅ **Middleware**: Kontrollerar cookies innan sidan laddas
- ✅ **ProtectedRoute**: Komponent för att skydda enskilda sidor
- ✅ **AuthContext**: Global användarhantering på klientsidan

## 🚀 **Arkitektur**

### **Server-Side (SSR)**
```
Layout.tsx → getServerSession() → Backend API → User Data → AuthProvider
```

### **Client-Side (CSR)**
```
AuthProvider → useAuth() → ProtectedRoute → Komponenter
```

### **Middleware**
```
Request → Middleware → Cookie Check → Redirect/Continue
```

## 🔧 **Komponenter**

### **1. serverSession.ts**
Server-side utility för att hämta användarsession.

```typescript
import { getServerSession } from '@/lib/serverSession'

// I layout.tsx eller page.tsx
const user = await getServerSession()
```

**Funktioner:**
- `getServerSession()` - Hämtar användardata från backend
- `isServerAuthenticated()` - Kontrollerar auth-status
- `isServerSuperUser()` - Kontrollerar superuser-status
- `isPublicRoute()` - Identifierar publika rutter
- `requiresAuthentication()` - Kontrollerar om auth krävs

### **2. AuthContext.tsx**
React Context för att hantera användardata på klientsidan.

```typescript
import { useAuth } from '@/lib/AuthContext'

function MyComponent() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  
  if (isLoading) return <div>Laddar...</div>
  if (!isAuthenticated) return <div>Ej inloggad</div>
  
  return <div>Välkommen {user.username}!</div>
}
```

**Hooks:**
- `useAuth()` - Huvudhook för auth-data
- `useSuperUser()` - Kontrollerar superuser-status
- `useTenantId()` - Hämtar tenant ID
- `useUsername()` - Hämtar användarnamn

### **3. ProtectedRoute.tsx**
Komponent för att skydda enskilda sidor.

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute requireSuperUser>
      <AdminContent />
    </ProtectedRoute>
  )
}
```

**Props:**
- `requireSuperUser` - Kräver superuser-behörighet
- `fallback` - Custom loading/error state

### **4. Middleware**
Automatisk route-skydd på nätverksnivå.

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  if (isProtectedRoute(pathname)) {
    const hasAuth = request.cookies.has('access_token')
    if (!hasAuth) {
      return NextResponse.redirect('/login')
    }
  }
  
  return NextResponse.next()
}
```

## 🎯 **Användningsexempel**

### **Exempel 1: Skydda en sida**
```typescript
// page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

### **Exempel 2: Kräva superuser**
```typescript
// admin/page.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminPage() {
  return (
    <ProtectedRoute requireSuperUser>
      <AdminContent />
    </ProtectedRoute>
  )
}
```

### **Exempel 3: Använd auth-data**
```typescript
// component.tsx
import { useAuth } from '@/lib/AuthContext'

export function UserProfile() {
  const { user, logout } = useAuth()
  
  return (
    <div>
      <h1>Profil för {user.username}</h1>
      <p>Email: {user.email}</p>
      <p>Tenant: {user.tenant_id}</p>
      <button onClick={logout}>Logga ut</button>
    </div>
  )
}
```

### **Exempel 4: HOC för skydd**
```typescript
// page.tsx
import { withProtectedRoute } from '@/components/auth/ProtectedRoute'

function DashboardContent() {
  return <div>Dashboard innehåll</div>
}

export default withProtectedRoute(DashboardContent)
```

## 🔒 **Säkerhetsfunktioner**

### **Server-Side Validation**
- Cookies läses på servern, inte i webbläsaren
- Session kontrolleras innan sidan renderas
- Inga tokens exponeras i localStorage

### **Route Protection**
- Middleware kontrollerar cookies innan sidan laddas
- Automatisk redirect till login vid behov
- Publika rutter lämnas orörda

### **Permission Control**
- Superuser-behörigheter kontrolleras
- Navigation filtreras baserat på behörighet
- Komponenter skyddas baserat på användarroll

## 🧪 **Testning**

### **Test-sida**
Gå till `/test-server-session` för att testa:

1. **Server-side session**: Verifiera att data kommer från servern
2. **AuthContext integration**: Testa useAuth hook
3. **ProtectedRoute**: Verifiera skydd av sidor
4. **Permission handling**: Testa superuser-behörigheter

### **Test-scenarios**
- Session-hantering på servern
- Cookie-baserad autentisering
- Route-skydd via middleware
- Komponent-skydd via ProtectedRoute
- Behörighetskontroll

## 🔄 **Migration från localStorage**

### **Före (osäkert)**
```typescript
// Gammal kod med localStorage
const token = localStorage.getItem('token')
const user = JSON.parse(localStorage.getItem('user') || 'null')

if (token && user) {
  // Användare är inloggad
} else {
  // Användare är ej inloggad
}
```

### **Efter (säkert)**
```typescript
// Ny kod med server-side session
import { useAuth } from '@/lib/AuthContext'

function MyComponent() {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <div>Ej inloggad</div>
  }
  
  return <div>Välkommen {user.username}!</div>
}
```

## 📚 **Filer och Struktur**

```
frontend/src/
├── lib/
│   ├── serverSession.ts      # Server-side session utility
│   ├── AuthContext.tsx       # React Context för auth
│   ├── apiClient.ts          # API-klient med cookies
│   └── authClient.ts         # Client-side auth-klient
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx # Route-skydd komponent
├── app/
│   ├── layout.tsx            # Root layout med AuthProvider
│   └── test-server-session/  # Test-sida
└── middleware.ts             # Route-skydd middleware
```

## 🚨 **Viktiga Noteringar**

### **Do's**
- ✅ Använd ProtectedRoute för skyddade sidor
- ✅ Använd useAuth() hook för användardata
- ✅ Lita på server-side session-data
- ✅ Hantera loading-states korrekt

### **Don'ts**
- ❌ Använd inte localStorage för auth-data
- ❌ Ignorera inte auth-errors
- ❌ Skapa inte manuella auth-checks
- ❌ Exponera inte tokens i klienten

## 🔧 **Konfiguration**

### **Environment Variables**
```bash
# Backend URL för server-side fetch
BACKEND_URL=http://localhost:8000
```

### **Middleware Config**
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

*Senast uppdaterad: 2025-08-21*
*Status: Implementerad och testad*
*Ansvarig: Platform Team*
