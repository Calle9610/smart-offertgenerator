# 🔄 **Migration Guide: Gamla Auth-Helpers → Ny Arkitektur**

## 📋 **Översikt**

Denna guide hjälper dig att migrera från gamla auth-helpers till den nya säkra autentiseringsarkitekturen.

## 🚨 **Varning**

Alla gamla auth-helpers är nu **DEPRECATED** och kommer att varna i konsolen. De kommer att tas bort i nästa major version.

## 🔧 **Migration Steps**

### **1. Ta bort gamla imports**

```typescript
// ❌ GAMMALT (DEPRECATED)
import { getToken, setToken, authHeader } from '@/lib/deprecated-auth'
import { getToken, setToken, authHeader } from '@/lib/utils'
import { getToken, setToken, authHeader } from './auth-helpers'

// ✅ NYTT
import { get, post, put, del } from '@/lib/apiClient'
import { getSession, login, logout } from '@/lib/authClient'
import { withAuth } from '@/lib/withAuth'
```

### **2. Ersätt auth-funktioner**

#### **Token-hantering**
```typescript
// ❌ GAMMALT
const token = getToken()
setToken(newToken)
clearToken()

// ✅ NYTT
const { user } = useAuth() // Från AuthContext
// Tokens hanteras automatiskt via cookies
```

#### **API-anrop med auth**
```typescript
// ❌ GAMMALT
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${getToken()}`,
    ...authHeader()
  }
})

// ✅ NYTT
const data = await get('/api/endpoint')
const data = await post('/api/endpoint', payload)
const data = await put('/api/endpoint', payload)
const data = await del('/api/endpoint')
```

#### **Auth-kontroll**
```typescript
// ❌ GAMMALT
if (isAuthenticated()) {
  // Do something
}

// ✅ NYTT
const { isAuthenticated } = useAuth()
if (isAuthenticated) {
  // Do something
}
```

#### **Sid-skydd**
```typescript
// ❌ GAMMALT
function MyPage() {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return null
  }
  return <div>Protected content</div>
}

// ✅ NYTT
function MyPage({ user }: { user: User }) {
  return <div>Protected content for {user.username}</div>
}

export default withAuth(MyPage)
```

### **3. Uppdatera komponenter**

#### **Före (med gamla helpers)**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { getToken, authHeader } from '@/lib/deprecated-auth'

export default function MyComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const token = getToken()
    if (!token) return
    
    fetch('/api/data', {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...authHeader()
      }
    })
    .then(res => res.json())
    .then(setData)
  }, [])
  
  return <div>{data}</div>
}
```

#### **Efter (med ny arkitektur)**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { get } from '@/lib/apiClient'
import { withAuth } from '@/lib/withAuth'

function MyComponent({ user }: { user: User }) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    get('/api/data')
      .then(setData)
      .catch(console.error)
  }, [])
  
  return <div>Data for {user.username}: {data}</div>
}

export default withAuth(MyComponent)
```

## 📚 **Nya API:er**

### **apiClient**
- `get(url)` - GET request med auth
- `post(url, data)` - POST request med auth
- `put(url, data)` - PUT request med auth
- `del(url)` - DELETE request med auth

### **authClient**
- `getSession()` - Hämta aktuell session
- `login(credentials)` - Logga in
- `logout()` - Logga ut
- `isAuthenticated` - Session status

### **withAuth HOC**
- `withAuth(Component)` - Skydda komponent
- `withSuperUser(Component)` - Skydda med superuser-krav
- `withAuth(Component, { redirectTo: '/custom' })` - Custom redirect

### **useRequireAuth Hook**
- `useRequireAuth()` - Auth-kontroll med hook
- `useRequireSuperUser()` - Superuser-kontroll
- `useRequireAuth({ redirectTo: '/custom' })` - Custom options

## 🧹 **Cleanup Checklist**

- [ ] Ta bort alla imports av gamla auth-helpers
- [ ] Ersätt `getToken()`, `setToken()`, `clearToken()`
- [ ] Ersätt `authHeader()`, `getAuthHeader()`
- [ ] Ersätt `isAuthenticated()`, `getCurrentUser()`
- [ ] Ersätt `authenticatedFetch()`, `apiCall()`, `secureRequest()`
- [ ] Uppdatera alla API-anrop till apiClient
- [ ] Lägg till withAuth HOC på skyddade sidor
- [ ] Testa att allt fungerar utan varningar
- [ ] Ta bort `deprecated-auth-helpers.ts` filen

## 🚀 **Exempel på komplett migration**

### **Före: Gamla auth-helpers**
```typescript
// utils/auth.ts
export function getToken() {
  return localStorage.getItem('token')
}

export function authHeader() {
  const token = getToken()
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

// Component.tsx
import { getToken, authHeader } from '@/utils/auth'

function MyComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const token = getToken()
    if (!token) return
    
    fetch('/api/data', {
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      }
    })
    .then(res => res.json())
    .then(setData)
  }, [])
  
  return <div>{data}</div>
}
```

### **Efter: Ny arkitektur**
```typescript
// apiClient.ts (redan implementerad)
export { get, post, put, del } from '@/lib/apiClient'

// Component.tsx
import { get } from '@/lib/apiClient'
import { withAuth } from '@/lib/withAuth'

function MyComponent({ user }: { user: User }) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    get('/api/data')
      .then(setData)
      .catch(console.error)
  }, [])
  
  return <div>Data for {user.username}: {data}</div>
}

export default withAuth(MyComponent)
```

## 📖 **Läs mer**

- [API Client Documentation](./apiClient.md)
- [Auth Client Documentation](./authClient.md)
- [Guard HOC Documentation](./guard-hooks.md)
- [Server Session Documentation](./serverSession.md)

---

*Senast uppdaterad: 2025-08-21*
*Status: Migration Guide*
*Ansvarig: Platform Team*
