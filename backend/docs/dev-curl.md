# Backend cURL Commands - Development Guide

This document provides executable cURL commands for testing the complete backend flow, including authentication, quote generation, and public endpoints.

## 🔧 Setup Variables

Set these variables at the top of your terminal session for easy reuse:

```bash
# Base URLs
export API_BASE="http://localhost:8000"
export FRONTEND_BASE="http://localhost:3000"

# Test data
export CUSTOMER_NAME="Test Customer AB"
export PROJECT_NAME="Badrumsrenovering Test"
export CUSTOMER_EMAIL="customer@example.com"

# JWT Token (will be set after login)
export JWT_TOKEN=""

# Generated IDs (will be set during flow)
export REQUIREMENTS_ID=""
export PROFILE_ID=""
export QUOTE_ID=""
export PUBLIC_TOKEN=""
export PACKAGE_ID=""
```

## 🔐 Authentication

### 1. Login and Get JWT Token

```bash
# Login to get JWT token
curl -X POST "${API_BASE}/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" \
  -s | jq -r '.access_token' | tee /tmp/jwt_token

# Set JWT token for subsequent requests
export JWT_TOKEN=$(cat /tmp/jwt_token)
echo "JWT Token: ${JWT_TOKEN:0:20}..."

# Verify token is set
if [ -z "$JWT_TOKEN" ]; then
    echo "❌ Failed to get JWT token"
    exit 1
else
    echo "✅ JWT token obtained successfully"
fi
```

**Expected Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

## 📋 Project Requirements

### 2. Create Project Requirements

```bash
# Create project requirements
curl -X POST "${API_BASE}/project-requirements" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "room_type": "bathroom",
    "finish_level": "standard",
    "area_m2": 15.5,
    "has_plumbing_work": true,
    "has_electrical_work": false,
    "notes": "Badrumsrenovering med kakel och nytt handfat"
  }' \
  -s | jq '.' | tee /tmp/requirements_response

# Extract requirements ID
export REQUIREMENTS_ID=$(cat /tmp/requirements_response | jq -r '.id')
echo "Requirements ID: ${REQUIREMENTS_ID}"
```

**Expected Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "company_id": "456e7890-e89b-12d3-a456-426614174000",
  "data": {
    "room_type": "bathroom",
    "finish_level": "standard",
    "area_m2": 15.5,
    "has_plumbing_work": true,
    "has_electrical_work": false,
    "notes": "Badrumsrenovering med kakel och nytt handfat"
  },
  "created_at": "2025-08-12T10:00:00",
  "updated_at": "2025-08-12T10:00:00"
}
```

### 3. Get Project Requirements

```bash
# Get all project requirements
curl -X GET "${API_BASE}/project-requirements" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.'

# Get specific requirements by ID
curl -X GET "${API_BASE}/project-requirements/${REQUIREMENTS_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.'
```

## 🏗️ Generation Rules

### 4. Create Generation Rule

```bash
# Create generation rule for bathroom|standard
curl -X POST "${API_BASE}/generation-rules" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bathroom|standard",
    "rules": {
      "labor": {
        "SNICK": "8+2*area_m2",
        "ELEK": "4+has_electrical_work*2",
        "VVS": "6+has_plumbing_work*3"
      },
      "materials": {
        "KAKEL20": "area_m2*1.2",
        "FUG": "area_m2*0.1",
        "HAND": "1",
        "SPISK": "1"
      }
    }
  }' \
  -s | jq '.'
```

**Expected Response:**
```json
{
  "id": "789e0123-e89b-12d3-a456-426614174000",
  "company_id": "456e7890-e89b-12d3-a456-426614174000",
  "key": "bathroom|standard",
  "rules": {
    "labor": {
      "SNICK": "8+2*area_m2",
      "ELEK": "4+has_electrical_work*2",
      "VVS": "6+has_plumbing_work*3"
    },
    "materials": {
      "KAKEL20": "area_m2*1.2",
      "FUG": "area_m2*0.1",
      "HAND": "1",
      "SPISK": "1"
    }
  },
  "created_at": "2025-08-12T10:00:00",
  "updated_at": "2025-08-12T10:00:00"
}
```

### 5. Test Generation Rule

```bash
# Test generation rule with sample data
curl -X POST "${API_BASE}/admin/rules/test" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "bathroom|standard",
    "requirementsData": {
      "area_m2": 15.5,
      "has_plumbing_work": 1,
      "has_electrical_work": 0
    }
  }' \
  -s | jq '.'
```

## 💰 Price Profiles

### 6. Get Price Profiles

```bash
# Get all price profiles
curl -X GET "${API_BASE}/price-profiles" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.' | tee /tmp/profiles_response

# Extract first profile ID
export PROFILE_ID=$(cat /tmp/profiles_response | jq -r '.[0].id')
echo "Profile ID: ${PROFILE_ID}"
```

**Expected Response:**
```json
[
  {
    "id": "abc12345-e89b-12d3-a456-426614174000",
    "name": "Standard",
    "company_id": "456e7890-e89b-12d3-a456-426614174000",
    "currency": "SEK",
    "vat_rate": 25.0
  }
]
```

## 🚀 Quote Auto-Generation

### 7. Auto-Generate Quote

```bash
# Auto-generate quote from requirements
curl -X POST "${API_BASE}/quotes/autogenerate" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "requirements_id": "'${REQUIREMENTS_ID}'",
    "profile_id": "'${PROFILE_ID}'"
  }' \
  -s | jq '.' | tee /tmp/autogenerate_response
```

**Expected Response:**
```json
{
  "items": [
    {
      "kind": "labor",
      "ref": "SNICK",
      "description": "Snickare",
      "qty": 39.0,
      "unit": "hour",
      "unit_price": 650.0,
      "line_total": 25350.0,
      "confidence_per_item": 0.9
    },
    {
      "kind": "material",
      "ref": "KAKEL20",
      "description": "Kakel 20x20cm",
      "qty": 18.6,
      "unit": "m2",
      "unit_price": 216.0,
      "line_total": 4017.6,
      "confidence_per_item": 0.9
    }
  ],
  "subtotal": 29367.6,
  "vat": 7341.9,
  "total": 36709.5,
  "tuning_applied": [],
  "confidence_per_item": {
    "SNICK": "low",
    "KAKEL20": "low"
  }
}
```

## 📝 Quote Creation

### 8. Create Quote with Source Items

```bash
# Create quote with auto-generated items and source items for tuning
curl -X POST "${API_BASE}/quotes" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "'${CUSTOMER_NAME}'",
    "project_name": "'${PROJECT_NAME}'",
    "profile_id": "'${PROFILE_ID}'",
    "currency": "SEK",
    "vat_rate": 25.0,
    "room_type": "bathroom",
    "finish_level": "standard",
    "items": [
      {
        "kind": "labor",
        "ref": "SNICK",
        "description": "Snickare",
        "qty": 39.0,
        "unit": "hour",
        "unit_price": 650.00
      },
      {
        "kind": "material",
        "ref": "KAKEL20",
        "description": "Kakel 20x20cm",
        "qty": 18.6,
        "unit": "m2",
        "unit_price": 216.00
      }
    ],
    "source_items": [
      {
        "kind": "labor",
        "ref": "SNICK",
        "description": "Snickare",
        "qty": 35.0,
        "unit": "hour",
        "unit_price": 650.00
      },
      {
        "kind": "material",
        "ref": "KAKEL20",
        "description": "Kakel 20x20cm",
        "qty": 16.0,
        "unit": "m2",
        "unit_price": 216.00
      }
    ]
  }' \
  -s | jq '.' | tee /tmp/quote_response

# Extract quote ID
export QUOTE_ID=$(cat /tmp/quote_response | jq -r '.id')
echo "Quote ID: ${QUOTE_ID}"
```

**Expected Response:**
```json
{
  "id": "def67890-e89b-12d3-a456-426614174000",
  "subtotal": 29367.6,
  "vat": 7341.9,
  "total": 36709.5
}
```

### 9. Get Quote Details

```bash
# Get all quotes
curl -X GET "${API_BASE}/quotes" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.'

# Get specific quote
curl -X GET "${API_BASE}/quotes/${QUOTE_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.'
```

## 📧 Quote Sending

### 10. Send Quote (Email Stub)

```bash
# Send quote via email (stub implementation)
curl -X POST "${API_BASE}/quotes/${QUOTE_ID}/send" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "'${CUSTOMER_EMAIL}'",
    "message": "Här är din offert för badrumsrenovering. Klicka på länken nedan för att se detaljer och acceptera."
  }' \
  -s | jq '.' | tee /tmp/send_response

# Extract public URL
export PUBLIC_URL=$(cat /tmp/send_response | jq -r '.public_url')
export PUBLIC_TOKEN=$(echo $PUBLIC_URL | sed 's/.*\/quote\///')
echo "Public Token: ${PUBLIC_TOKEN}"
echo "Public URL: ${PUBLIC_URL}"
```

**Expected Response:**
```json
{
  "sent": true,
  "public_url": "http://localhost:3000/public/quote/abc123def456",
  "message": "Quote sent successfully to customer@example.com"
}
```

## 🌐 Public Quote Access

### 11. View Public Quote

```bash
# Access public quote without authentication
curl -X GET "${API_BASE}/public/quotes/${PUBLIC_TOKEN}" \
  -s | jq '.' | tee /tmp/public_quote_response
```

**Expected Response:**
```json
{
  "company_name": "Default Company AB",
  "project_name": "Badrumsrenovering Test",
  "customer_name": "Test Customer AB",
  "currency": "SEK",
  "items": [
    {
      "kind": "labor",
      "description": "Snickare",
      "qty": 39.0,
      "unit": "hour",
      "unit_price": 650.0,
      "line_total": 25350.0
    }
  ],
  "subtotal": 29367.6,
  "vat": 7341.9,
  "total": 36709.5,
  "packages": [],
  "accepted_package_id": null,
  "summary": null,
  "assumptions": null,
  "exclusions": null,
  "timeline": null,
  "created_at": "2025-08-12T10:00:00"
}
```

### 12. Update Quote Selection (Optional Items)

```bash
# Update selected options for public quote
curl -X POST "${API_BASE}/public/quotes/${PUBLIC_TOKEN}/update-selection" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedItemIds": ["item-uuid-1", "item-uuid-2"]
  }' \
  -s | jq '.'
```

## ✅ Quote Acceptance

### 13. Accept Quote

```bash
# Accept quote with package
curl -X POST "${API_BASE}/public/quotes/${PUBLIC_TOKEN}/accept" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "'${PACKAGE_ID:-"default"}'",
    "selectedItemIds": []
  }' \
  -s | jq '.'
```

**Expected Response:**
```json
{
  "message": "Quote accepted successfully with package: Standard",
  "status": "ACCEPTED",
  "quote_id": "def67890-e89b-12d3-a456-426614174000",
  "package_id": "package-uuid",
  "package_name": "Standard"
}
```

### 14. Decline Quote (Alternative)

```bash
# Decline quote
curl -X POST "${API_BASE}/public/quotes/${PUBLIC_TOKEN}/decline" \
  -s | jq '.'
```

**Expected Response:**
```json
{
  "message": "Quote declined successfully",
  "status": "DECLINED",
  "quote_id": "def67890-e89b-12d3-a456-426614174000"
}
```

## 📊 Quote Packages

### 15. Generate Quote Packages

```bash
# Generate different package options
curl -X POST "${API_BASE}/quotes/${QUOTE_ID}/packages/generate" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "package_names": ["Basic", "Standard", "Premium"],
    "discount_percentages": [0, 5, 10]
  }' \
  -s | jq '.' | tee /tmp/packages_response

# Extract package ID for acceptance
export PACKAGE_ID=$(cat /tmp/packages_response | jq -r '.packages[0].id')
echo "Package ID: ${PACKAGE_ID}"
```

**Expected Response:**
```json
{
  "message": "Successfully generated 3 packages",
  "packages": [
    {
      "id": "pkg-123",
      "name": "Basic",
      "subtotal": 29367.6,
      "vat": 7341.9,
      "total": 36709.5,
      "is_default": true
    }
  ],
  "quote_id": "def67890-e89b-12d3-a456-426614174000"
}
```

### 16. Get Quote Packages

```bash
# Get all packages for a quote
curl -X GET "${API_BASE}/quotes/${QUOTE_ID}/packages" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.'
```

## 📈 Auto-Tuning Insights

### 17. Get Auto-Tuning Insights

```bash
# Get insights about auto-tuning patterns
curl -X GET "${API_BASE}/auto-tuning/insights" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.'
```

**Expected Response:**
```json
{
  "insights": [
    {
      "item_ref": "SNICK",
      "room_type": "bathroom",
      "finish_level": "standard",
      "adjustment_factor": 1.11,
      "sample_count": 5,
      "confidence_score": 0.8,
      "interpretation": "Snickare behöver 11% mer tid än beräknat"
    }
  ],
  "total_patterns": 1,
  "average_confidence": 0.8,
  "most_adjusted_item": "SNICK",
  "improvement_suggestions": [
    "Systemet lär sig bra från användarjusteringar. Fortsätt att använda auto-generering."
  ]
}
```

## 🔍 Quote Options and History

### 18. Get Quote Options

```bash
# Get option groups for quote
curl -X GET "${API_BASE}/quotes/${QUOTE_ID}/options" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.'
```

### 19. Update Quote Options

```bash
# Update selected options
curl -X POST "${API_BASE}/quotes/${QUOTE_ID}/options" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "selected_items": ["item-uuid-1", "item-uuid-2"]
  }' \
  -s | jq '.'
```

### 20. Get Options History

```bash
# Get complete options change history
curl -X GET "${API_BASE}/quotes/${QUOTE_ID}/options-history" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -s | jq '.'
```

## 📄 PDF Generation

### 21. Generate PDF

```bash
# Generate PDF with selected options
curl -X POST "${API_BASE}/quotes/${QUOTE_ID}/pdf" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "selectedItemIds": ["item-uuid-1", "item-uuid-2"]
  }' \
  --output quote.pdf
```

## 🏥 Health Checks

### 22. Health Endpoints

```bash
# Basic health check
curl -X GET "${API_BASE}/health" -s | jq '.'

# Simple health check for load balancers
curl -X GET "${API_BASE}/healthz" -s | jq '.'

# Database readiness check
curl -X GET "${API_BASE}/readiness" -s | jq '.'
```

## 🔄 Complete Flow Script

### 23. Run Complete Flow

Create a script file `run_complete_flow.sh`:

```bash
#!/bin/bash

# Set error handling
set -e

echo "🚀 Starting complete backend flow test..."

# Source variables
source ./set_variables.sh

# Run all steps
echo "1. Authenticating..."
source ./step_1_auth.sh

echo "2. Creating project requirements..."
source ./step_2_requirements.sh

echo "3. Creating generation rule..."
source ./step_3_rules.sh

echo "4. Auto-generating quote..."
source ./step_4_autogenerate.sh

echo "5. Creating quote..."
source ./step_5_create_quote.sh

echo "6. Sending quote..."
source ./step_6_send.sh

echo "7. Testing public access..."
source ./step_7_public.sh

echo "8. Accepting quote..."
source ./step_8_accept.sh

echo "✅ Complete flow test successful!"
echo "Quote ID: ${QUOTE_ID}"
echo "Public URL: ${PUBLIC_URL}"
```

## 🧪 Testing Commands

### 24. Test Authentication

```bash
# Test without JWT (should fail)
curl -X GET "${API_BASE}/quotes" -s | jq '.'

# Test with invalid JWT (should fail)
curl -X GET "${API_BASE}/quotes" \
  -H "Authorization: Bearer invalid_token" \
  -s | jq '.'
```

### 25. Test Validation

```bash
# Test with invalid data (should return 422)
curl -X POST "${API_BASE}/quotes" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "",
    "project_name": ""
  }' \
  -s | jq '.'
```

## 📝 Troubleshooting

### Common Issues

1. **JWT Token Expired**
   ```bash
   # Re-authenticate
   export JWT_TOKEN=$(curl -X POST "${API_BASE}/token" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin&password=admin123" \
     -s | jq -r '.access_token')
   ```

2. **Database Connection Issues**
   ```bash
   # Check readiness
   curl -X GET "${API_BASE}/readiness" -s | jq '.'
   ```

3. **Missing Dependencies**
   ```bash
   # Install required packages
   pip install jq
   ```

### Debug Mode

```bash
# Enable verbose output
curl -v -X GET "${API_BASE}/quotes" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Show response headers
curl -i -X GET "${API_BASE}/quotes" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

## 📚 Additional Resources

- **API Documentation**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Dashboard**: `http://localhost:8000/health`
- **Frontend**: `http://localhost:3000`

## 🔒 Security Notes

- JWT tokens expire after 30 minutes
- All protected endpoints require valid JWT
- Public endpoints are accessible without authentication
- Rate limiting may apply to public endpoints
- Database queries are multi-tenant scoped

---

**Note**: This document assumes the backend is running on `localhost:8000` and the frontend on `localhost:3000`. Adjust URLs as needed for your environment.
