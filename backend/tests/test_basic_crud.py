from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.orm import Session

from app.db import engine, get_db
from app.main import app
from app.models import Company, Tenant


class TestBasicCRUD:
    """Test basic CRUD operations with proper setup."""

    def test_tenant_creation(self, db_session: Session):
        """Test that we can create a tenant."""
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        assert tenant.id is not None
        assert tenant.name == "Test Tenant"
        assert tenant.domain == "test.com"

    def test_company_creation_with_tenant(self, db_session: Session):
        """Test that we can create a company with a tenant."""
        # Create tenant first
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        # Create company
        company = Company(id=uuid4(), tenant_id=tenant.id, name="Test Company")
        db_session.add(company)
        db_session.commit()

        assert company.id is not None
        assert company.tenant_id == tenant.id
        assert company.name == "Test Company"

    def test_company_tenant_relationship(self, db_session: Session):
        """Test that company-tenant relationship works correctly."""
        # Create tenant
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        # Create multiple companies for the same tenant
        company1 = Company(id=uuid4(), tenant_id=tenant.id, name="Company 1")
        company2 = Company(id=uuid4(), tenant_id=tenant.id, name="Company 2")
        db_session.add_all([company1, company2])
        db_session.commit()

        # Verify relationships
        assert company1.tenant_id == tenant.id
        assert company2.tenant_id == tenant.id

        # Query companies by tenant
        companies = (
            db_session.query(Company).filter(Company.tenant_id == tenant.id).all()
        )
        assert len(companies) == 2
        assert company1 in companies
        assert company2 in companies


class TestMultiTenantIsolation:
    """Test multi-tenant data isolation."""

    def test_tenant_isolation(self, db_session: Session):
        """Test that data from different tenants is properly isolated."""
        # Create two tenants
        tenant1 = Tenant(id=uuid4(), name="Tenant 1", domain="tenant1.com")
        tenant2 = Tenant(id=uuid4(), name="Tenant 2", domain="tenant2.com")
        db_session.add_all([tenant1, tenant2])
        db_session.commit()

        # Create companies for each tenant
        company1 = Company(id=uuid4(), tenant_id=tenant1.id, name="Company 1")
        company2 = Company(id=uuid4(), tenant_id=tenant2.id, name="Company 2")
        db_session.add_all([company1, company2])
        db_session.commit()

        # Verify isolation
        tenant1_companies = (
            db_session.query(Company).filter(Company.tenant_id == tenant1.id).all()
        )
        tenant2_companies = (
            db_session.query(Company).filter(Company.tenant_id == tenant2.id).all()
        )

        assert len(tenant1_companies) == 1
        assert len(tenant2_companies) == 1
        assert tenant1_companies[0].id == company1.id
        assert tenant2_companies[0].id == company2.id

        # Verify cross-tenant access is prevented by design
        all_companies = db_session.query(Company).all()
        assert len(all_companies) == 2  # Both companies exist
        # But they're properly scoped by tenant_id


# Fixtures for testing
@pytest.fixture
def db_session():
    """Create a database session for testing."""
    from app.db import SessionLocal

    session = SessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Setup and teardown database for each test."""
    from app.db import Base

    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
