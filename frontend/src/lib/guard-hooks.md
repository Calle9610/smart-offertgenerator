# 🛡️ **Guard HOC/Hook Documentation**

## 📋 **Översikt**

Enkla och flexibla verktyg för att skydda sidor utan att hantera tokens lokalt. Både HOC (Higher-Order Component) och hook-baserade lösningar tillhandahålls för olika användningsfall.

## ✨ **Funktioner**

- ✅ **withAuth HOC**: Enkel syntax för att skydda komponenter
- ✅ **useRequireAuth Hook**: Flexibel auth-kontroll med hooks
- ✅ **Automatisk redirect**: Till /login vid ej autentisering
- ✅ **Superuser-behörigheter**: Kontroll av användarroll
- ✅ **Loading states**: Automatisk hantering av loading
- ✅ **Type safety**: Fullständigt TypeScript-stöd

## 🚀 **Snabbstart**

### **HOC Approach (Enkel)**
```typescript
import { withAuth } from '@/lib/withAuth'

function DashboardContent({ user }: { user: User }) {
  return <div>Välkommen {user.username}!</div>
}

export default withAuth(DashboardContent)
```

### **Hook Approach (Flexibel)**
```typescript
import { useRequireAuth } from '@/lib/useRequireAuth'

function ProfileContent() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  
  if (isLoading) return <div>Laddar...</div>
  if (!isAuthenticated) return <div>Ej inloggad</div>
  
  return <div>Välkommen {user.username}!</div>
}
```

## 🔧 **API Reference**

### **withAuth HOC**

#### `withAuth(Component, options?)`
Skyddar en komponent med autentisering.

```typescript
import { withAuth } from '@/lib/withAuth'

interface WithAuthOptions {
  redirectTo?: string           // Custom redirect URL (default: /login)
  requireSuperUser?: boolean    // Kräver superuser-behörighet
  fallback?: React.ComponentType // Custom loading komponent
}

// Enkel användning
export default withAuth(MyComponent)

// Med options
export default withAuth(MyComponent, {
  redirectTo: '/custom-login',
  requireSuperUser: true,
  fallback: CustomLoading
})
```

#### `withSuperUser(Component, options?)`
Skyddar komponenter som kräver superuser-behörighet.

```typescript
import { withSuperUser } from '@/lib/withAuth'

export default withSuperUser(AdminComponent)
```

#### `withAuthRedirect(Component, redirectTo)`
Skyddar komponenter med custom redirect.

```typescript
import { withAuthRedirect } from '@/lib/withAuth'

export default withAuthRedirect(MyComponent, '/custom-login')
```

### **useRequireAuth Hook**

#### `useRequireAuth(options?)`
Hook för att skydda komponenter med autentisering.

```typescript
import { useRequireAuth } from '@/lib/useRequireAuth'

interface UseRequireAuthOptions {
  redirectTo?: string           // Custom redirect URL
  requireSuperUser?: boolean    // Kräver superuser-behörighet
  onUnauthorized?: () => void   // Custom unauthorized callback
}

function MyComponent() {
  const { user, isLoading, isAuthenticated, isSuperUser } = useRequireAuth({
    redirectTo: '/custom-login',
    requireSuperUser: true,
    onUnauthorized: () => console.log('Unauthorized!')
  })
  
  // Använd auth-state
}
```

#### `useRequireSuperUser(options?)`
Hook för komponenter som kräver superuser-behörighet.

```typescript
import { useRequireSuperUser } from '@/lib/useRequireAuth'

function AdminComponent() {
  const { user, isLoading, isSuperUser } = useRequireSuperUser()
  
  if (!isSuperUser) return <div>Ingen behörighet</div>
  
  return <div>Admin innehåll</div>
}
```

#### `useRequireAuthRedirect(redirectTo, options?)`
Hook med custom redirect.

```typescript
import { useRequireAuthRedirect } from '@/lib/useRequireAuth'

function MyComponent() {
  const { user } = useRequireAuthRedirect('/custom-login')
  
  return <div>Välkommen {user?.username}!</div>
}
```

#### `useRequireAuthCustom(onUnauthorized, options?)`
Hook med custom unauthorized-hantering.

```typescript
import { useRequireAuthCustom } from '@/lib/useRequireAuth'

function MyComponent() {
  const { user } = useRequireAuthCustom(() => {
    // Custom hantering istället för redirect
    showCustomModal()
  })
  
  return <div>Innehåll</div>
}
```

## 🎯 **Användningsexempel**

### **Exempel 1: Enkel sid-skydd (HOC)**
```typescript
// pages/dashboard.tsx
import { withAuth } from '@/lib/withAuth'

function DashboardPage({ user }: { user: User }) {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Välkommen {user.username}!</p>
      <p>Email: {user.email}</p>
      <p>Tenant: {user.tenant_id}</p>
    </div>
  )
}

export default withAuth(DashboardPage)
```

### **Exempel 2: Superuser-skydd (HOC)**
```typescript
// pages/admin.tsx
import { withSuperUser } from '@/lib/withAuth'

function AdminPage({ user }: { user: User }) {
  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Välkommen superuser {user.username}!</p>
      <AdminControls />
    </div>
  )
}

export default withSuperUser(AdminPage)
```

### **Exempel 3: Flexibel auth-kontroll (Hook)**
```typescript
// components/Profile.tsx
import { useRequireAuth } from '@/lib/useRequireAuth'

export function Profile() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  
  if (isLoading) {
    return <div>Laddar profil...</div>
  }
  
  if (!isAuthenticated) {
    return <div>Du måste logga in för att se profilen</div>
  }
  
  return (
    <div>
      <h2>Profil för {user.username}</h2>
      <ProfileForm user={user} />
    </div>
  )
}
```

### **Exempel 4: Custom unauthorized-hantering**
```typescript
// components/ProtectedContent.tsx
import { useRequireAuth } from '@/lib/useRequireAuth'

export function ProtectedContent() {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  
  const { user } = useRequireAuth({
    onUnauthorized: () => {
      setShowLoginPrompt(true)
    }
  })
  
  if (showLoginPrompt) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p>Du måste logga in för att se detta innehåll</p>
        <button onClick={() => window.location.href = '/login'}>
          Logga in
        </button>
      </div>
    )
  }
  
  if (!user) return null
  
  return <div>Skyddat innehåll för {user.username}</div>
}
```

### **Exempel 5: Conditional rendering baserat på behörighet**
```typescript
// components/UserDashboard.tsx
import { useRequireAuth } from '@/lib/useRequireAuth'

export function UserDashboard() {
  const { user, isSuperUser } = useRequireAuth()
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Alla användare ser detta */}
      <UserStats user={user} />
      
      {/* Endast superusers ser detta */}
      {isSuperUser && (
        <div>
          <h2>Admin Tools</h2>
          <AdminTools />
        </div>
      )}
    </div>
  )
}
```

## 🔄 **Migration från localStorage**

### **Före (osäkert)**
```typescript
// Gammal kod med localStorage
function DashboardPage() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    
    // Hämta användardata
    fetchUser(token).then(setUser).finally(() => setIsLoading(false))
  }, [])
  
  if (isLoading) return <div>Laddar...</div>
  if (!user) return null
  
  return <div>Välkommen {user.username}!</div>
}
```

### **Efter (säkert med HOC)**
```typescript
// Ny kod med withAuth HOC
function DashboardPage({ user }: { user: User }) {
  return <div>Välkommen {user.username}!</div>
}

export default withAuth(DashboardPage)
```

### **Efter (säkert med hook)**
```typescript
// Ny kod med useRequireAuth hook
function DashboardPage() {
  const { user, isLoading } = useRequireAuth()
  
  if (isLoading) return <div>Laddar...</div>
  
  return <div>Välkommen {user.username}!</div>
}
```

## 🔒 **Säkerhetsfunktioner**

### **Ingen localStorage**
- Alla tokens hanteras via säkra cookies
- Server-side session-validering
- Automatisk redirect vid behov

### **Automatisk hantering**
- Loading states hanteras automatiskt
- Redirect-logik är inbyggd
- Error handling är inbyggt

### **Behörighetskontroll**
- Superuser-behörigheter kontrolleras
- Tenant-isolation via server-side session
- Flexibel behörighetshantering

## 🧪 **Testning**

### **Test-sida**
Gå till `/test-guard-hooks` för att testa:

1. **withAuth HOC**: Enkel sid-skydd
2. **withSuperUser HOC**: Superuser-behörigheter
3. **useRequireAuth Hook**: Flexibel auth-kontroll
4. **useRequireSuperUser Hook**: Superuser-hook
5. **Custom unauthorized**: Anpassad hantering

### **Test-scenarios**
- Automatisk redirect till login
- Loading state-hantering
- Superuser-behörigheter
- Custom unauthorized-hantering
- Type safety och props

## 📚 **Filer och Struktur**

```
frontend/src/
├── lib/
│   ├── withAuth.tsx           # HOC-baserat skydd
│   ├── useRequireAuth.ts      # Hook-baserat skydd
│   ├── authClient.ts          # Underliggande auth-klient
│   └── serverSession.ts       # Server-side session
├── app/
│   └── test-guard-hooks/      # Test-sida
└── components/
    └── auth/
        └── ProtectedRoute.tsx  # Komponent-baserat skydd
```

## 🚨 **Viktiga Noteringar**

### **Do's**
- ✅ Använd HOC för enkelt sid-skydd
- ✅ Använd hook för flexibel kontroll
- ✅ Lita på automatisk redirect
- ✅ Hantera loading states korrekt

### **Don'ts**
- ❌ Hantera inte tokens manuellt
- ❌ Använd inte localStorage
- ❌ Ignorera inte auth-errors
- ❌ Skapa inte manuella auth-checks

## 🔧 **Konfiguration**

### **Default Redirect**
```typescript
// Standard redirect är /login
export default withAuth(MyComponent)

// Custom redirect
export default withAuth(MyComponent, { redirectTo: '/custom-login' })
```

### **Custom Loading State**
```typescript
// Custom loading komponent
export default withAuth(MyComponent, {
  fallback: CustomLoadingComponent
})
```

### **Superuser Requirements**
```typescript
// Kräver superuser
export default withSuperUser(AdminComponent)

// Eller med HOC
export default withAuth(AdminComponent, { requireSuperUser: true })
```

---

*Senast uppdaterad: 2025-08-21*
*Status: Implementerad och testad*
*Ansvarig: Platform Team*
