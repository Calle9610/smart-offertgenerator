#!/usr/bin/env python3
"""Create a test user for login testing."""

from uuid import uuid4

from app.auth import get_password_hash
from app.db import SessionLocal
from app.models import Company, Tenant, User


def create_test_user():
    """Create a test tenant, company, and user."""
    db = SessionLocal()
    try:
        # Create tenant
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db.add(tenant)
        db.flush()

        # Create company
        company = Company(id=uuid4(), tenant_id=tenant.id, name="Test Company AB")
        db.add(company)
        db.flush()

        # Create user (User model only has tenant_id, not company_id)
        user = User(
            id=uuid4(),
            tenant_id=tenant.id,  # Only tenant_id, not company_id
            email="admin@test.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin User",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()

        print(f"✅ Test user created successfully!")
        print(f"   Username: admin")
        print(f"   Password: admin123")
        print(f"   Tenant ID: {tenant.id}")
        print(f"   Company ID: {company.id}")
        print(f"   User ID: {user.id}")

    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_test_user()
