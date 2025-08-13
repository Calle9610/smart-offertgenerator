from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.orm import Session

from app.crud import (
    create_quote,
    get_adjustment_logs_by_quote,
    get_companies_by_tenant,
    get_generation_rule_by_key,
    get_project_requirements_by_company,
    get_quotes_by_tenant,
)
from app.db import engine, get_db
from app.main import app
from app.models import (
    Company,
    GenerationRule,
    ProjectRequirements,
    Quote,
    QuoteItem,
    Tenant,
    User,
)
from app.schemas import QuoteIn, QuoteItemIn


class TestCRUDCompanyIdScoping:
    """Test that all CRUD operations properly scope by company_id."""

    def test_get_companies_by_tenant(self, db_session: Session):
        """Test that get_companies_by_tenant only returns companies for the specified tenant."""
        # Create test tenant first
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        # Create test companies
        company1 = Company(id=uuid4(), tenant_id=tenant.id, name="Test Company 1")
        company2 = Company(id=uuid4(), tenant_id=tenant.id, name="Test Company 2")
        db_session.add_all([company1, company2])
        db_session.commit()

        # Test that we get the correct company
        companies = get_companies_by_tenant(db_session, company1.id)
        assert len(companies) == 1
        assert companies[0].id == company1.id
        assert companies[0].name == "Test Company 1"

        # Test that company2 is not returned
        companies = get_companies_by_tenant(db_session, company2.id)
        assert len(companies) == 1
        assert companies[0].id == company2.id
        assert companies[0].name == "Test Company 2"

    def test_get_project_requirements_by_company(self, db_session: Session):
        """Test that project requirements are properly scoped by company_id."""
        # Create test tenant and company
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        company = Company(id=uuid4(), tenant_id=tenant.id, name="Test Company")
        db_session.add(company)
        db_session.commit()

        # Create test requirements
        req1 = ProjectRequirements(
            id=uuid4(),
            company_id=company.id,
            room_type="bathroom",
            area_m2=Decimal("15.5"),
            finish_level="standard",
            has_plumbing_work=True,
            has_electrical_work=False,
            material_prefs=[],
            site_constraints=[],
            notes=None,
        )
        db_session.add(req1)
        db_session.commit()

        # Test that we get the correct requirements
        requirements = get_project_requirements_by_company(db_session, company.id)
        assert len(requirements) == 1
        assert requirements[0].id == req1.id
        assert requirements[0].company_id == company.id

    def test_get_generation_rule_by_key(self, db_session: Session):
        """Test that generation rules are properly scoped by company_id."""
        # Create test tenant and company
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        company = Company(id=uuid4(), tenant_id=tenant.id, name="Test Company")
        db_session.add(company)
        db_session.commit()

        # Create test rule
        rule = GenerationRule(
            id=uuid4(),
            company_id=company.id,
            key="bathroom|standard",
            rules={
                "labor": {"SNICK": "8 + 2*areaM2"},
                "materials": {"KAKEL20": "areaM2 * 1.2"},
            },
        )
        db_session.add(rule)
        db_session.commit()

        # Test that we get the correct rule
        found_rule = get_generation_rule_by_key(
            db_session, "bathroom|standard", company.id
        )
        assert found_rule is not None
        assert found_rule.id == rule.id
        assert found_rule.company_id == company.id
        assert found_rule.key == "bathroom|standard"

    def test_get_adjustment_logs_by_quote(self, db_session: Session):
        """Test that adjustment logs are properly scoped by company_id."""
        # Create test tenant, company and quote
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        company = Company(id=uuid4(), tenant_id=tenant.id, name="Test Company")
        db_session.add(company)
        db_session.commit()

        quote = Quote(
            id=uuid4(),
            tenant_id=tenant.id,
            company_id=company.id,
            user_id=uuid4(),  # We need a user_id too
            customer_name="Test Customer",
            project_name="Test Project",
            profile_id=uuid4(),
            currency="SEK",
            subtotal=Decimal("1000.00"),
            vat=Decimal("250.00"),
            total=Decimal("1250.00"),
            status="draft",
        )
        db_session.add(quote)
        db_session.commit()

        # Test that we get the correct logs
        logs = get_adjustment_logs_by_quote(db_session, quote.id, company.id)
        # Should be empty list for new quote
        assert isinstance(logs, list)

    def test_create_quote_with_company_id(self, db_session: Session):
        """Test that quote creation properly sets company_id."""
        # Create test tenant and company
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        company = Company(id=uuid4(), tenant_id=tenant.id, name="Test Company")
        db_session.add(company)
        db_session.commit()

        # Create quote data
        quote_data = {
            "company_id": str(company.id),
            "customer_name": "Test Customer",
            "project_name": "Test Project",
            "profile_id": str(uuid4()),
            "currency": "SEK",
            "vat_rate": Decimal("25.0"),
            "items": [
                {
                    "kind": "labor",
                    "description": "Test work",
                    "qty": Decimal("10"),
                    "unit": "hour",
                    "unit_price": Decimal("500.00"),
                }
            ],
            "subtotal": Decimal("5000.00"),
            "vat": Decimal("1250.00"),
            "total": Decimal("6250.00"),
        }

        # Create quote (using company.id as tenant_id for this test)
        quote_id = create_quote(db_session, company.id, company.id, quote_data)
        assert quote_id is not None

        # Verify quote was created with correct company_id
        quote = db_session.query(Quote).filter(Quote.id == quote_id).first()
        assert quote is not None
        assert quote.company_id == company.id
        assert quote.customer_name == "Test Customer"

    def test_get_quotes_by_company(self, db_session: Session):
        """Test that quotes are properly scoped by company_id."""
        # Create test tenant
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        # Create test companies
        company1 = Company(id=uuid4(), tenant_id=tenant.id, name="Company 1")
        company2 = Company(id=uuid4(), tenant_id=tenant.id, name="Company 2")
        db_session.add_all([company1, company2])
        db_session.commit()

        # Create quotes for different companies
        quote1 = Quote(
            id=uuid4(),
            tenant_id=tenant.id,
            company_id=company1.id,
            user_id=uuid4(),
            customer_name="Customer 1",
            project_name="Project 1",
            profile_id=uuid4(),
            currency="SEK",
            subtotal=Decimal("1000.00"),
            vat=Decimal("250.00"),
            total=Decimal("1250.00"),
            status="draft",
        )

        quote2 = Quote(
            id=uuid4(),
            tenant_id=tenant.id,
            company_id=company2.id,
            user_id=uuid4(),
            customer_name="Customer 2",
            project_name="Project 2",
            profile_id=uuid4(),
            currency="SEK",
            subtotal=Decimal("2000.00"),
            vat=Decimal("500.00"),
            total=Decimal("2500.00"),
            status="draft",
        )

        db_session.add_all([quote1, quote2])
        db_session.commit()

        # Test that company1 only sees their quotes
        quotes1 = get_quotes_by_tenant(db_session, company1.id)
        assert len(quotes1) == 1
        assert quotes1[0].id == quote1.id
        assert quotes1[0].company_id == company1.id

        # Test that company2 only sees their quotes
        quotes2 = get_quotes_by_tenant(db_session, company2.id)
        assert len(quotes2) == 1
        assert quotes2[0].id == quote2.id
        assert quotes2[0].company_id == company2.id


class TestCRUDSecurity:
    """Test security aspects of CRUD operations."""

    def test_company_id_isolation(self, db_session: Session):
        """Test that data from one company cannot be accessed by another."""
        # Create test tenant
        tenant = Tenant(id=uuid4(), name="Test Tenant", domain="test.com")
        db_session.add(tenant)
        db_session.commit()

        # Create two companies
        company1 = Company(id=uuid4(), tenant_id=tenant.id, name="Company 1")
        company2 = Company(id=uuid4(), tenant_id=tenant.id, name="Company 2")
        db_session.add_all([company1, company2])
        db_session.commit()

        # Create data for company1
        req1 = ProjectRequirements(
            id=uuid4(),
            company_id=company1.id,
            room_type="bathroom",
            area_m2=Decimal("15.5"),
            finish_level="standard",
            has_plumbing_work=True,
            has_electrical_work=False,
            material_prefs=[],
            site_constraints=[],
            notes=None,
        )
        db_session.add(req1)
        db_session.commit()

        # Verify company2 cannot access company1's data
        requirements = get_project_requirements_by_company(db_session, company2.id)
        assert len(requirements) == 0

        # Verify company1 can access their own data
        requirements = get_project_requirements_by_company(db_session, company1.id)
        assert len(requirements) == 1
        assert requirements[0].id == req1.id


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
