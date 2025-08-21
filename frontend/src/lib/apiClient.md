# 🔐 **API Client Documentation**

## 📋 **Översikt**

`apiClient.ts` är en central fetch-wrapper som hanterar autentisering, CSRF-skydd och automatisk refresh-retry för alla API-anrop.

## ✨ **Funktioner**

- ✅ **Automatisk cookies**: `credentials: 'include'` på alla requests
- ✅ **CSRF-skydd**: X-CSRF-Token läggs till automatiskt
- ✅ **Automatisk refresh**: Vid 401 försöker denna refresh och replay
- ✅ **Enkel API**: `get()`, `post()`, `put()`, `del()` funktioner
- ✅ **Error handling**: Wrappar alla fel i ApiError-klass
- ✅ **TypeScript**: Fullständigt typat med generics

## 🚀 **Snabbstart**

### **Importera**
```typescript
import { get, post, put, del } from '@/lib/apiClient'
```

### **Grundläggande användning**
```typescript
// GET request
const users = await get('/api/users')

// POST request
const newUser = await post('/api/users', { name: 'John', email: 'john@example.com' })

// PUT request
const updatedUser = await put('/api/users/1', { name: 'John Updated' })

// DELETE request
await del('/api/users/1')
```

## 🔧 **API Reference**

### **Core Functions**

#### `get<T>(url, headers?)`
```typescript
// GET /api/users
const users: User[] = await get('/api/users')

// GET med custom headers
const user = await get('/api/users/1', { 'Accept': 'application/json' })
```

#### `post<T>(url, body?, headers?)`
```typescript
// POST /api/users
const newUser: User = await post('/api/users', {
  name: 'John',
  email: 'john@example.com'
})

// POST med custom headers
const result = await post('/api/upload', formData, { 'Accept': 'text/plain' })
```

#### `put<T>(url, body?, headers?)`
```typescript
// PUT /api/users/1
const updatedUser: User = await put('/api/users/1', {
  name: 'John Updated',
  email: 'john.updated@example.com'
})
```

#### `del<T>(url, headers?)`
```typescript
// DELETE /api/users/1
await del('/api/users/1')
```

### **Utility Functions**

#### `patch<T>(url, body?, headers?)`
```typescript
// PATCH /api/users/1
const patchedUser = await patch('/api/users/1', { name: 'John Patched' })
```

#### `upload<T>(url, formData, headers?)`
```typescript
// Upload fil
const formData = new FormData()
formData.append('file', file)
const result = await upload('/api/upload', formData)
```

#### `download(url, filename?)`
```typescript
// Ladda ner fil
await download('/api/files/document.pdf', 'document.pdf')
```

## 🔒 **Automatisk Autentisering**

### **Cookies**
Alla requests skickar automatiskt cookies med `credentials: 'include'`. Ingen manuell hantering behövs.

### **CSRF-skydd**
CSRF-tokens hämtas automatiskt från `/api/csrf-token` och läggs till i headers för alla unsafe methods (POST, PUT, DELETE, PATCH).

### **Automatisk Refresh**
Vid 401-svar:
1. Anropar automatiskt `/api/auth/refresh`
2. Om refresh lyckas, replayar originalanropet
3. Max 1 retry för att undvika oändliga loopar

## 🎯 **Användningsexempel**

### **Exempel 1: Enkel GET**
```typescript
import { get } from '@/lib/apiClient'

async function fetchUsers() {
  try {
    const users = await get('/api/users')
    console.log('Users:', users)
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
}
```

### **Exempel 2: POST med data**
```typescript
import { post } from '@/lib/apiClient'

async function createUser(userData: CreateUserRequest) {
  try {
    const newUser = await post('/api/users', userData)
    console.log('Created user:', newUser)
    return newUser
  } catch (error) {
    console.error('Failed to create user:', error)
    throw error
  }
}
```

### **Exempel 3: File upload**
```typescript
import { upload } from '@/lib/apiClient'

async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const result = await upload('/api/upload', formData)
    console.log('Upload successful:', result)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### **Exempel 4: Error handling**
```typescript
import { get, ApiError } from '@/lib/apiClient'

async function fetchProtectedData() {
  try {
    const data = await get('/api/protected')
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        // Redirect to login
        window.location.href = '/login'
      } else if (error.status === 403) {
        // Show permission denied message
        alert('Du har inte behörighet att se denna data')
      } else if (error.status === 404) {
        // Show not found message
        alert('Data kunde inte hittas')
      }
    } else {
      // Handle other errors
      console.error('Unexpected error:', error)
    }
  }
}
```

## 🔧 **Konfiguration**

### **CSRF Endpoint**
Standard: `/api/csrf-token`
Kan ändras genom att uppdatera `CSRFManager.get()` metoden.

### **Refresh Endpoint**
Standard: `/api/auth/refresh`
Kan ändras genom att uppdatera `refreshAuth()` funktionen.

### **Max Retry Count**
Standard: 1 retry
Kan ändras genom att uppdatera `MAX_REFRESH_RETRIES` konstanten.

## 🧪 **Testning**

### **Kör tester**
```bash
npm test -- apiClient.test.ts
```

### **Test-scenarios**
- CSRF token management
- Automatisk refresh-retry
- Error handling
- Request/response wrapper
- File uploads
- Non-JSON responses

## 🚨 **Viktiga Noteringar**

### **Do's**
- ✅ Använd alltid apiClient istället för direkt fetch
- ✅ Hantera errors med try-catch
- ✅ Använd TypeScript generics för type safety

### **Don'ts**
- ❌ Lägg inte till Authorization headers manuellt
- ❌ Hantera inte cookies manuellt
- ❌ Använd inte localStorage för tokens

## 🔄 **Migration från gammal kod**

### **Före (osäkert)**
```typescript
const token = localStorage.getItem('token')
const response = await fetch('/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### **Efter (säkert)**
```typescript
import { get } from '@/lib/apiClient'

const users = await get('/api/users')
// Cookies och CSRF hanteras automatiskt!
```

## 📚 **Relaterade filer**

- `frontend/src/lib/apiClient.ts` - Huvudfilen
- `frontend/src/lib/__tests__/apiClient.test.ts` - Tester
- `frontend/docs/auth-migration.md` - Migrationsguide

---

*Senast uppdaterad: 2025-08-21*
*Status: Implementerad och testad*
*Ansvarig: Platform Team*
