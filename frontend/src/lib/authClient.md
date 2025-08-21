# 🔐 **Auth Client Documentation**

## 📋 **Översikt**

`authClient.ts` är en autentiseringsklient som hanterar användarsessioner med cookie-baserad autentisering. Den använder apiClient för säker kommunikation och hanterar automatiskt cookies.

## ✨ **Funktioner**

- ✅ **getSession()** - Hämtar aktuell användare från `/api/users/me`
- ✅ **login(credentials)** - Loggar in användare via `/api/auth/login`
- ✅ **logout()** - Loggar ut användare via `/api/auth/logout`
- ✅ **isAuthenticated()** - Kontrollerar om användare är inloggad
- ✅ **isSuperUser()** - Kontrollerar om användare är superuser
- ✅ **getTenantId()** - Hämtar användarens tenant ID
- ✅ **getUsername()** - Hämtar användarens användarnamn

## 🚀 **Snabbstart**

### **Importera**
```typescript
import { getSession, login, logout } from '@/lib/authClient'
```

### **Grundläggande användning**
```typescript
// Kontrollera om användare är inloggad
const user = await getSession()
if (user) {
  console.log('Inloggad som:', user.username)
} else {
  console.log('Ej inloggad')
}

// Logga in användare
const user = await login({ username: 'admin', password: 'password' })
console.log('Inloggad som:', user.username)

// Logga ut användare
await logout()
console.log('Utloggad')
```

## 🔧 **API Reference**

### **Core Functions**

#### `getSession(): Promise<User | null>`
Hämtar aktuell användarsession från backend.

```typescript
const user = await getSession()
if (user) {
  console.log('User:', user.username, user.email)
} else {
  console.log('Ingen aktiv session')
}
```

#### `login(credentials: LoginCredentials): Promise<User>`
Loggar in användare med användarnamn och lösenord.

```typescript
try {
  const user = await login({ 
    username: 'admin', 
    password: 'password' 
  })
  console.log('Inloggad som:', user.username)
} catch (error) {
  console.error('Login misslyckades:', error.message)
}
```

#### `logout(): Promise<boolean>`
Loggar ut användare och rensar cookies.

```typescript
try {
  await logout()
  console.log('Utloggad framgångsrikt')
} catch (error) {
  console.error('Logout misslyckades:', error.message)
}
```

### **Utility Functions**

#### `isAuthenticated(): Promise<boolean>`
Kontrollerar om användare är inloggad.

```typescript
const authenticated = await isAuthenticated()
if (authenticated) {
  console.log('Användare är inloggad')
} else {
  console.log('Användare är ej inloggad')
}
```

#### `isSuperUser(): Promise<boolean>`
Kontrollerar om användare är superuser.

```typescript
const isSuper = await isSuperUser()
if (isSuper) {
  console.log('Användare är superuser')
} else {
  console.log('Användare är ej superuser')
}
```

#### `getTenantId(): Promise<string | null>`
Hämtar användarens tenant ID.

```typescript
const tenantId = await getTenantId()
if (tenantId) {
  console.log('Tenant ID:', tenantId)
}
```

#### `getUsername(): Promise<string | null>`
Hämtar användarens användarnamn.

```typescript
const username = await getUsername()
if (username) {
  console.log('Username:', username)
}
```

## 🎯 **Användningsexempel**

### **Exempel 1: Enkel session-kontroll**
```typescript
import { getSession } from '@/lib/authClient'

async function checkUserStatus() {
  const user = await getSession()
  
  if (user) {
    return {
      isLoggedIn: true,
      username: user.username,
      email: user.email,
      isSuperUser: user.is_superuser
    }
  } else {
    return {
      isLoggedIn: false,
      username: null,
      email: null,
      isSuperUser: false
    }
  }
}
```

### **Exempel 2: Login med felhantering**
```typescript
import { login } from '@/lib/authClient'

async function handleLogin(username: string, password: string) {
  try {
    const user = await login({ username, password })
    
    // Login lyckades
    return {
      success: true,
      user,
      message: `Välkommen ${user.username}!`
    }
  } catch (error) {
    // Login misslyckades
    return {
      success: false,
      user: null,
      message: error instanceof Error ? error.message : 'Okänt fel'
    }
  }
}
```

### **Exempel 3: Logout med redirect**
```typescript
import { logout } from '@/lib/authClient'

async function handleLogout() {
  try {
    await logout()
    
    // Redirect till login-sida
    window.location.href = '/login'
  } catch (error) {
    console.error('Logout failed:', error)
    
    // Redirect ändå om logout misslyckas
    window.location.href = '/login'
  }
}
```

### **Exempel 4: Protected route wrapper**
```typescript
import { getSession, isAuthenticated } from '@/lib/authClient'

async function ProtectedComponent() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const authenticated = await isAuthenticated()
        if (authenticated) {
          const userData = await getSession()
          setUser(userData)
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return <div>Laddar...</div>
  }

  if (!isAuthorized) {
    return <div>Du måste logga in för att se denna sida</div>
  }

  return (
    <div>
      <h1>Välkommen {user.username}!</h1>
      {/* Protected content */}
    </div>
  )
}
```

## 🔒 **Säkerhetsfunktioner**

### **Cookies**
- Alla requests skickar automatiskt cookies via apiClient
- Cookies sätts automatiskt av backend vid login
- Cookies rensas automatiskt av backend vid logout

### **Error Handling**
- Svenska felmeddelanden för användarvänlighet
- Specifika felmeddelanden för olika HTTP-statusar
- Graceful fallback för nätverksfel

### **Session Management**
- Automatisk session-kontroll
- Tenant-isolation
- Superuser-behörigheter

## 🧪 **Testning**

### **Test-sida**
Gå till `/test-auth-client` för att testa alla funktioner:

1. **Get Session** - Kontrollera aktuell session
2. **Login** - Testa inloggning med credentials
3. **Logout** - Testa utloggning
4. **Is Authenticated** - Kontrollera autentiseringsstatus
5. **Is Super User** - Kontrollera superuser-status

### **Test-scenarios**
- Session-hantering
- Login/logout flow
- Cookie-hantering
- Error handling
- Permission checks

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
// Ny kod med authClient
import { getSession, isAuthenticated } from '@/lib/authClient'

const user = await getSession()
const authenticated = await isAuthenticated()

if (authenticated && user) {
  // Användare är inloggad
} else {
  // Användare är ej inloggad
}
```

## 📚 **Relaterade filer**

- `frontend/src/lib/authClient.ts` - Huvudfilen
- `frontend/src/lib/apiClient.ts` - Underliggande API-klient
- `frontend/src/app/test-auth-client/page.tsx` - Test-sida
- `backend/app/main.py` - Backend endpoints

## 🚨 **Viktiga Noteringar**

### **Do's**
- ✅ Använd alltid authClient för autentisering
- ✅ Hantera errors med try-catch
- ✅ Kontrollera session-status regelbundet

### **Don'ts**
- ❌ Hantera inte cookies manuellt
- ❌ Använd inte localStorage för auth-data
- ❌ Ignorera inte auth-errors

---

*Senast uppdaterad: 2025-08-21*
*Status: Implementerad och testad*
*Ansvarig: Platform Team*
