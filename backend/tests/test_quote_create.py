"""
Smoke test for quote creation endpoint.

This test reproduces the crash/error that occurs when trying to create a new quote.
Run with: pytest -q backend/tests/test_quote_create.py

How to run:
1. Start backend: cd backend && python -m uvicorn app.main:app --reload
2. Run test: pytest -q backend/tests/test_quote_create.py -v
3. Check output for stack trace and error details

Expected behavior: POST /quotes should return 200/201 with correct JSON
Current behavior: CRASH/ERROR - this test will show the exact error
"""

import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import Base, get_db
from app import crud, schemas
from app.auth import create_access_token


# Test database setup - use PostgreSQL to match production
SQLALCHEMY_DATABASE_URL = "postgresql+psycopg://app:app@localhost:5432/quotes_test"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def setup_test_db():
    """Create test database tables once for the session."""
    try:
        Base.metadata.create_all(bind=engine)
        yield
    finally:
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(setup_test_db):
    """Test client with overridden database."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def db_session():
    """Database session for test setup."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_tenant(db_session):
    """Create test tenant."""
    tenant_data = schemas.TenantCreate(name="Test Company", domain="test.local")
    tenant = crud.create_tenant(db_session, tenant_data)
    return tenant


@pytest.fixture
def test_company(db_session, test_tenant):
    """Create test company."""
    company_data = schemas.CompanyCreate(name="Test Company", tenant_id=test_tenant.id)
    company = crud.create_company(db_session, company_data)
    return company


@pytest.fixture
def test_user(db_session, test_tenant):
    """Create test user."""
    user_data = schemas.UserCreate(
        email="test@example.com",
        username="testuser",
        password="testpass123",
        tenant_id=test_tenant.id
    )
    user = crud.create_user(db_session, user_data)
    return user


@pytest.fixture
def test_price_profile(db_session, test_company):
    """Create test price profile."""
    profile_data = {
        "company_id": test_company.id,
        "name": "Standard",
        "currency": "SEK",
        "vat_rate": Decimal("25.0")
    }
    profile = crud.create_price_profile(db_session, profile_data)
    return profile


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers."""
    access_token = create_access_token(data={"sub": test_user.username})
    return {"Authorization": f"Bearer {access_token}"}


def test_create_quote_minimal_payload(client, auth_headers, test_tenant, test_company, test_user, test_price_profile):
    """
    Test creating quote with minimal payload - this should reproduce the crash.
    
    Minimal payload based on QuoteIn schema requirements:
    - customer_name: str (required)
    - profile_id: str (required) 
    - items: List[QuoteItemIn] (required)
    
    Each QuoteItemIn requires:
    - kind: str (required)
    - qty: Decimal (required)
    - unit_price: Decimal (required)
    """
    
    # Minimal valid payload
    minimal_payload = {
        "customer_name": "Test Customer",
        "profile_id": str(test_price_profile.id),
        "items": [
            {
                "kind": "labor",
                "qty": Decimal("2.0"),
                "unit_price": Decimal("500.0")
            }
        ]
    }
    
    print(f"\n🔍 Testing with minimal payload:")
    print(f"Payload: {minimal_payload}")
    print(f"Auth headers: {auth_headers}")
    print(f"Test user tenant_id: {test_user.tenant_id}")
    print(f"Test company id: {test_company.id}")
    print(f"Test price profile id: {test_price_profile.id}")
    
    try:
        # This should either work or show the exact error
        response = client.post("/quotes", json=minimal_payload, headers=auth_headers)
        
        print(f"\n✅ Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # If we get here, the endpoint worked
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        
        response_data = response.json()
        assert "id" in response_data, "Response should contain quote id"
        assert "subtotal" in response_data, "Response should contain subtotal"
        assert "vat" in response_data, "Response should contain vat"
        assert "total" in response_data, "Response should contain total"
        
        print(f"✅ Quote created successfully with ID: {response_data['id']}")
        
    except Exception as e:
        print(f"\n❌ CRASH/ERROR occurred:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        
        # Print full traceback for debugging
        import traceback
        print(f"\n📋 Full traceback:")
        traceback.print_exc()
        
        # Re-raise to fail the test
        raise


def test_create_quote_with_optional_fields(client, auth_headers, test_tenant, test_company, test_user, test_price_profile):
    """
    Test creating quote with all optional fields to see if any cause issues.
    """
    
    full_payload = {
        "customer_name": "Test Customer",
        "project_name": "Test Project",
        "profile_id": str(test_price_profile.id),
        "currency": "SEK",
        "vat_rate": Decimal("25.0"),
        "items": [
            {
                "kind": "labor",
                "ref": "LAB001",
                "description": "Installation work",
                "qty": Decimal("2.0"),
                "unit": "hour",
                "unit_price": Decimal("500.0"),
                "is_optional": False,
                "option_group": None
            }
        ],
        "source_items": None,
        "room_type": None,
        "finish_level": None
    }
    
    print(f"\n🔍 Testing with full payload:")
    print(f"Payload: {full_payload}")
    
    try:
        response = client.post("/quotes", json=full_payload, headers=auth_headers)
        
        print(f"\n✅ Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        
        response_data = response.json()
        assert "id" in response_data, "Response should contain quote id"
        
        print(f"✅ Quote created successfully with ID: {response_data['id']}")
        
    except Exception as e:
        print(f"\n❌ CRASH/ERROR occurred with full payload:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        
        import traceback
        print(f"\n📋 Full traceback:")
        traceback.print_exc()
        
        raise


def test_create_quote_validation_errors(client, auth_headers):
    """
    Test various validation error cases to ensure proper error handling.
    """
    
    # Test missing required fields
    invalid_payloads = [
        {},  # Empty payload
        {"customer_name": "Test"},  # Missing profile_id and items
        {"profile_id": "123"},  # Missing customer_name and items
        {"customer_name": "Test", "profile_id": "123"},  # Missing items
        {
            "customer_name": "Test",
            "profile_id": "123", 
            "items": []  # Empty items list
        },
        {
            "customer_name": "Test",
            "profile_id": "123",
            "items": [{"kind": "labor"}]  # Missing qty and unit_price
        }
    ]
    
    for i, payload in enumerate(invalid_payloads):
        print(f"\n🔍 Testing invalid payload {i+1}: {payload}")
        
        try:
            response = client.post("/quotes", json=payload, headers=auth_headers)
            
            # Should get validation error, not crash
            assert response.status_code in [400, 422], f"Expected 400/422 for invalid payload, got {response.status_code}"
            print(f"✅ Got expected validation error: {response.status_code}")
            
        except Exception as e:
            print(f"❌ Unexpected error for invalid payload: {e}")
            raise


if __name__ == "__main__":
    # Run the test directly for debugging
    pytest.main([__file__, "-v", "-s"])
