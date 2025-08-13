# 📦 Quote Packages - cURL Examples

Detta dokument innehåller cURL-exempel för att testa paketoffert-funktionaliteten.

## 🔑 **Förberedelse**

Först behöver du logga in och få en JWT-token:

```bash
# 1. Logga in för att få JWT-token
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Spara token från svaret
TOKEN="din_jwt_token_här"
```

## 📋 **1. Generera paket för en offert**

```bash
# Generera Basic, Standard, Premium paket
curl -X POST "http://localhost:8000/quotes/{QUOTE_ID}/packages/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_names": ["Basic", "Standard", "Premium"],
    "discount_percentages": [0, 5, 10]
  }'

# Exempel med specifikt quote ID
curl -X POST "http://localhost:8000/quotes/123e4567-e89b-12d3-a456-426614174000/packages/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_names": ["Basic", "Standard", "Premium"],
    "discount_percentages": [0, 5, 10]
  }'
```

**Förväntat svar:**
```json
{
  "message": "Successfully generated 3 packages",
  "packages": [
    {
      "id": "uuid-1",
      "quote_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Basic",
      "items": [...],
      "subtotal": "10000.00",
      "vat": "2500.00",
      "total": "12500.00",
      "is_default": true,
      "created_at": "2025-08-13T16:30:00"
    },
    {
      "id": "uuid-2",
      "name": "Standard",
      "subtotal": "9500.00",
      "vat": "2375.00",
      "total": "11875.00",
      "is_default": false
    },
    {
      "id": "uuid-3",
      "name": "Premium",
      "subtotal": "9000.00",
      "vat": "2250.00",
      "total": "11250.00",
      "is_default": false
    }
  ],
  "quote_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

## 📋 **2. Hämta paket för en offert**

```bash
# Hämta alla paket för en offert
curl -X GET "http://localhost:8000/quotes/{QUOTE_ID}/packages" \
  -H "Authorization: Bearer $TOKEN"

# Exempel med specifikt quote ID
curl -X GET "http://localhost:8000/quotes/123e4567-e89b-12d3-a456-426614174000/packages" \
  -H "Authorization: Bearer $TOKEN"
```

**Förväntat svar:**
```json
[
  {
    "id": "uuid-1",
    "quote_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Basic",
    "items": [...],
    "subtotal": "10000.00",
    "vat": "2500.00",
    "total": "12500.00",
    "is_default": true,
    "created_at": "2025-08-13T16:30:00"
  }
]
```

## 🌐 **3. Hämta publik offert med paket**

```bash
# Hämta publik offert (inkluderar paket)
curl -X GET "http://localhost:8000/public/quotes/{PUBLIC_TOKEN}"

# Exempel med specifikt token
curl -X GET "http://localhost:8000/public/quotes/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

**Förväntat svar:**
```json
{
  "company_name": "Demo Bygg AB",
  "project_name": "Badrum 6 m²",
  "customer_name": "Testkund AB",
  "currency": "SEK",
  "items": [...],
  "subtotal": "10000.00",
  "vat": "2500.00",
  "total": "12500.00",
  "packages": [
    {
      "id": "uuid-1",
      "name": "Basic",
      "items": [...],
      "subtotal": "10000.00",
      "vat": "2500.00",
      "total": "12500.00",
      "is_default": true
    }
  ],
  "accepted_package_id": null,
  "created_at": "2025-08-13T16:30:00"
}
```

## ✅ **4. Acceptera ett paket**

```bash
# Acceptera ett specifikt paket
curl -X POST "http://localhost:8000/public/quotes/{PUBLIC_TOKEN}/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "uuid-1"
  }'

# Exempel med specifikt token och package ID
curl -X POST "http://localhost:8000/public/quotes/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "123e4567-e89b-12d3-a456-426614174001"
  }'
```

**Förväntat svar:**
```json
{
  "message": "Quote accepted successfully with package: Basic",
  "status": "ACCEPTED",
  "quote_id": "123e4567-e89b-12d3-a456-426614174000",
  "package_id": "123e4567-e89b-12d3-a456-426614174001",
  "package_name": "Basic"
}
```

## ❌ **5. Avböja offert**

```bash
# Avböja offert
curl -X POST "http://localhost:8000/public/quotes/{PUBLIC_TOKEN}/decline"

# Exempel med specifikt token
curl -X POST "http://localhost:8000/public/quotes/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6/decline"
```

**Förväntat svar:**
```json
{
  "message": "Quote declined successfully",
  "status": "DECLINED",
  "quote_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

## 🔍 **6. Testa hela flödet**

Här är ett komplett exempel som testar hela flödet:

```bash
# 1. Logga in
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Token: $TOKEN"

# 2. Skapa en test-offert (använd befintlig endpoint)
QUOTE_RESPONSE=$(curl -s -X POST "http://localhost:8000/test/create-quote" \
  -H "Authorization: Bearer $TOKEN")

QUOTE_ID=$(echo $QUOTE_RESPONSE | jq -r '.quote_id')
echo "Quote ID: $QUOTE_ID"

# 3. Generera paket
PACKAGES_RESPONSE=$(curl -s -X POST "http://localhost:8000/quotes/$QUOTE_ID/packages/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_names": ["Basic", "Standard", "Premium"],
    "discount_percentages": [0, 5, 10]
  }')

echo "Packages generated: $PACKAGES_RESPONSE"

# 4. Hämta paket
PACKAGES=$(curl -s -X GET "http://localhost:8000/quotes/$QUOTE_ID/packages" \
  -H "Authorization: Bearer $TOKEN")

echo "Retrieved packages: $PACKAGES"

# 5. Hämta publik offert
PUBLIC_TOKEN=$(echo $QUOTE_RESPONSE | jq -r '.public_token')
PUBLIC_QUOTE=$(curl -s -X GET "http://localhost:8000/public/quotes/$PUBLIC_TOKEN")

echo "Public quote: $PUBLIC_QUOTE"

# 6. Acceptera ett paket
FIRST_PACKAGE_ID=$(echo $PACKAGES | jq -r '.[0].id')
ACCEPT_RESPONSE=$(curl -s -X POST "http://localhost:8000/public/quotes/$PUBLIC_TOKEN/accept" \
  -H "Content-Type: application/json" \
  -d "{\"packageId\": \"$FIRST_PACKAGE_ID\"}")

echo "Accept response: $ACCEPT_RESPONSE"
```

## 📝 **Anteckningar**

- **JWT-token**: Krävs för alla endpoints utom publika
- **Quote ID**: Använd ett giltigt quote ID från din databas
- **Public Token**: Genereras automatiskt när offerten skapas
- **Package ID**: Genereras när paketen skapas
- **Multi-tenant**: Alla endpoints är company-scopade via JWT

## 🚨 **Felhantering**

Vanliga fel och lösningar:

```bash
# 401 Unauthorized - Kontrollera JWT-token
# 404 Not Found - Kontrollera quote ID eller public token
# 400 Bad Request - Kontrollera request body format
# 500 Internal Server Error - Kontrollera backend logs
``` 
