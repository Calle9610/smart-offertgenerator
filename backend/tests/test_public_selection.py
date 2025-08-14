"""
Pytest tests for public quote selection endpoint.

Tests:
1. Correct totals calculation
2. Mandatory items always included
3. Group selection (radio) excludes others in same group
4. Events logged correctly
"""

import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models import Quote, QuoteItem, Company, PriceProfile, QuoteEvent
from app.schemas import PublicQuoteSelectionUpdateRequest
from app.crud import create_quote_event


@pytest.fixture
def client():
    """Test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_db():
    """Mock database session."""
    return MagicMock(spec=Session)


@pytest.fixture
def sample_quote():
    """Sample quote for testing."""
    return Quote(
        id="123e4567-e89b-12d3-a456-426614174000",
        customer_name="Test Customer",
        project_name="Test Project",
        currency="SEK",
        subtotal=Decimal("1000.00"),
        vat=Decimal("250.00"),
        total=Decimal("1250.00"),
        status="SENT",
        public_token="test_token_123",
        profile_id="456e7890-e89b-12d3-a456-426614174000"
    )


@pytest.fixture
def sample_company():
    """Sample company for testing."""
    return Company(
        id="789e0123-e89b-12d3-a456-426614174000",
        name="Test Company"
    )


@pytest.fixture
def sample_profile():
    """Sample price profile for testing."""
    return PriceProfile(
        id="456e7890-e89b-12d3-a456-426614174000",
        vat_rate=Decimal("25.0")
    )


@pytest.fixture
def sample_items():
    """Sample quote items for testing."""
    return [
        # Mandatory items
        QuoteItem(
            id="item-1",
            kind="labor",
            description="Grundarbete",
            qty=Decimal("10.0"),
            unit="hour",
            unit_price=Decimal("100.0"),
            line_total=Decimal("1000.0"),
            is_optional=False,
            option_group=None
        ),
        # Optional items - different groups
        QuoteItem(
            id="item-2",
            kind="material",
            description="Standard material",
            qty=Decimal("5.0"),
            unit="m2",
            unit_price=Decimal("50.0"),
            line_total=Decimal("250.0"),
            is_optional=True,
            option_group="materials"
        ),
        QuoteItem(
            id="item-3",
            kind="material",
            description="Premium material",
            qty=Decimal("5.0"),
            unit="m2",
            unit_price=Decimal("80.0"),
            line_total=Decimal("400.0"),
            is_optional=True,
            option_group="materials"
        ),
        QuoteItem(
            id="item-4",
            kind="labor",
            description="Extra service",
            qty=Decimal("2.0"),
            unit="hour",
            unit_price=Decimal("150.0"),
            line_total=Decimal("300.0"),
            is_optional=True,
            option_group="services"
        )
    ]


class TestPublicSelectionEndpoint:
    """Test class for public selection endpoint."""

    @patch('app.main.crud.get_quote_by_public_token')
    @patch('app.main.crud.create_quote_event')
    def test_correct_totals_calculation(
        self, 
        mock_create_event, 
        mock_get_quote, 
        client, 
        sample_quote, 
        sample_items
    ):
        """Test that totals are calculated correctly based on selection."""
        
        # Setup
        mock_get_quote.return_value = sample_quote
        mock_create_event.return_value = MagicMock(id="event-1")
        
        # Mock database query for quote items
        with patch('app.main.db.query') as mock_query:
            mock_query.return_value.filter.return_value.all.return_value = sample_items
            
            # Mock price profile query
            mock_query.return_value.filter.return_value.first.return_value = MagicMock(
                vat_rate=Decimal("25.0")
            )
            
            # Test with selected optional items
            request_data = {
                "selectedItemIds": ["item-2", "item-4"]  # Standard material + Extra service
            }
            
            response = client.post(
                "/public/quotes/test_token_123/update-selection",
                json=request_data
            )
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            
            # Expected calculations:
            # Base: 1000.0 (mandatory)
            # Optional: 250.0 + 300.0 = 550.0
            # Subtotal: 1550.0
            # VAT: 1550.0 * 0.25 = 387.5
            # Total: 1937.5
            
            assert data["base_subtotal"] == 1000.0
            assert data["optional_subtotal"] == 550.0
            assert data["subtotal"] == 1550.0
            assert data["vat"] == 387.5
            assert data["total"] == 1937.5
            assert data["selected_item_count"] == 2

    @patch('app.main.crud.get_quote_by_public_token')
    def test_mandatory_items_always_included(
        self, 
        mock_get_quote, 
        client, 
        sample_quote, 
        sample_items
    ):
        """Test that mandatory items are always included regardless of selection."""
        
        # Setup
        mock_get_quote.return_value = sample_quote
        
        with patch('app.main.db.query') as mock_query:
            mock_query.return_value.filter.return_value.all.return_value = sample_items
            mock_query.return_value.filter.return_value.first.return_value = MagicMock(
                vat_rate=Decimal("25.0")
            )
            
            # Test with no optional items selected
            request_data = {"selectedItemIds": []}
            
            response = client.post(
                "/public/quotes/test_token_123/update-selection",
                json=request_data
            )
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            
            # Mandatory items should always be included
            assert data["base_subtotal"] == 1000.0
            assert data["optional_subtotal"] == 0.0
            assert data["subtotal"] == 1000.0
            assert data["total"] == 1250.0  # 1000 + 25% VAT
            
            # Check that mandatory item is marked as selected
            mandatory_item = next(item for item in data["items"] if item["id"] == "item-1")
            assert mandatory_item["isSelected"] is True
            assert mandatory_item["line_total"] == 1000.0

    @patch('app.main.crud.get_quote_by_public_token')
    def test_group_selection_excludes_others_in_same_group(
        self, 
        mock_get_quote, 
        client, 
        sample_quote, 
        sample_items
    ):
        """Test that selecting one item in a group excludes others in the same group."""
        
        # Setup
        mock_get_quote.return_value = sample_quote
        
        with patch('app.main.db.query') as mock_query:
            mock_query.return_value.filter.return_value.all.return_value = sample_items
            mock_query.return_value.filter.return_value.first.return_value = MagicMock(
                vat_rate=Decimal("25.0")
            )
            
            # Test selecting premium material (should exclude standard material)
            request_data = {"selectedItemIds": ["item-3"]}  # Premium material only
            
            response = client.post(
                "/public/quotes/test_token_123/update-selection",
                json=request_data
            )
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            
            # Only premium material should be selected
            premium_item = next(item for item in data["items"] if item["id"] == "item-3")
            standard_item = next(item for item in data["items"] if item["id"] == "item-2")
            
            assert premium_item["isSelected"] is True
            assert premium_item["line_total"] == 400.0
            
            assert standard_item["isSelected"] is False
            assert standard_item["line_total"] == 0.0
            
            # Totals should reflect only premium material
            assert data["optional_subtotal"] == 400.0
            assert data["subtotal"] == 1400.0  # 1000 + 400

    @patch('app.main.crud.get_quote_by_public_token')
    @patch('app.main.crud.create_quote_event')
    def test_events_logged_correctly(
        self, 
        mock_create_event, 
        mock_get_quote, 
        client, 
        sample_quote, 
        sample_items
    ):
        """Test that option_updated events are logged correctly."""
        
        # Setup
        mock_get_quote.return_value = sample_quote
        mock_create_event.return_value = MagicMock(id="event-1")
        
        with patch('app.main.db.query') as mock_query:
            mock_query.return_value.filter.return_value.all.return_value = sample_items
            mock_query.return_value.filter.return_value.first.return_value = MagicMock(
                vat_rate=Decimal("25.0")
            )
            
            # Mock previous event query (no previous events)
            mock_query.return_value.filter.return_value.order_by.return_value.first.return_value = None
            
            # Test selection
            request_data = {"selectedItemIds": ["item-2"]}
            
            response = client.post(
                "/public/quotes/test_token_123/update-selection",
                json=request_data
            )
            
            # Assertions
            assert response.status_code == 200
            
            # Verify event was created
            mock_create_event.assert_called_once()
            
            # Check event parameters
            call_args = mock_create_event.call_args
            event_create = call_args[0][1]  # Second argument is QuoteEventCreate
            
            assert event_create.type == "option_updated"
            assert event_create.quote_id == sample_quote.id
            
            # Check metadata
            meta = event_create.meta
            assert "added" in meta
            assert "removed" in meta
            assert "total_difference" in meta
            assert "selected_item_ids" in meta
            assert meta["selected_item_count"] == 1
            assert meta["base_subtotal"] == 1000.0
            assert meta["optional_subtotal"] == 250.0

    @patch('app.main.crud.get_quote_by_public_token')
    @patch('app.main.crud.create_quote_event')
    def test_event_logging_with_previous_selection(
        self, 
        mock_create_event, 
        mock_get_quote, 
        client, 
        sample_quote, 
        sample_items
    ):
        """Test event logging when there are previous selections."""
        
        # Setup
        mock_get_quote.return_value = sample_quote
        mock_create_event.return_value = MagicMock(id="event-2")
        
        # Mock previous event
        previous_event = MagicMock()
        previous_event.meta = {
            "selected_item_ids": ["item-2"]  # Previously had standard material
        }
        
        with patch('app.main.db.query') as mock_query:
            mock_query.return_value.filter.return_value.all.return_value = sample_items
            mock_query.return_value.filter.return_value.first.return_value = MagicMock(
                vat_rate=Decimal("25.0")
            )
            
            # Mock previous event query
            mock_query.return_value.filter.return_value.order_by.return_value.first.return_value = previous_event
            
            # Test changing selection
            request_data = {"selectedItemIds": ["item-3"]}  # Switch to premium material
            
            response = client.post(
                "/public/quotes/test_token_123/update-selection",
                json=request_data
            )
            
            # Assertions
            assert response.status_code == 200
            
            # Verify event was created with correct added/removed
            mock_create_event.assert_called_once()
            call_args = mock_create_event.call_args
            event_create = call_args[0][1]
            
            meta = event_create.meta
            assert meta["added"] == ["item-3"]
            assert meta["removed"] == ["item-2"]
            assert meta["previous_selected_count"] == 1

    def test_invalid_token_returns_404(self, client):
        """Test that invalid token returns 404."""
        
        with patch('app.main.crud.get_quote_by_public_token') as mock_get_quote:
            mock_get_quote.return_value = None
            
            request_data = {"selectedItemIds": []}
            
            response = client.post(
                "/public/quotes/invalid_token/update-selection",
                json=request_data
            )
            
            assert response.status_code == 404
            assert "Quote not found" in response.json()["detail"]

    def test_invalid_status_returns_400(self, client, sample_quote):
        """Test that invalid quote status returns 400."""
        
        # Set invalid status
        sample_quote.status = "ACCEPTED"
        
        with patch('app.main.crud.get_quote_by_public_token') as mock_get_quote:
            mock_get_quote.return_value = sample_quote
            
            request_data = {"selectedItemIds": []}
            
            response = client.post(
                "/public/quotes/test_token_123/update-selection",
                json=request_data
            )
            
            assert response.status_code == 400
            assert "cannot be updated" in response.json()["detail"]

    def test_missing_selected_item_ids_returns_400(self, client):
        """Test that missing selectedItemIds returns 400."""
        
        response = client.post(
            "/public/quotes/test_token_123/update-selection",
            json={}  # Missing selectedItemIds
        )
        
        assert response.status_code == 422  # Validation error


class TestSelectionLogic:
    """Test class for selection logic functions."""

    def test_calculate_totals_with_mixed_items(self, sample_items):
        """Test total calculation with mixed mandatory and optional items."""
        
        # Simulate selection logic
        mandatory_items = [item for item in sample_items if not item.is_optional]
        selected_optional_items = [
            item for item in sample_items 
            if item.is_optional and item.id in ["item-2", "item-4"]
        ]
        
        # Calculate totals
        base_subtotal = sum(item.line_total for item in mandatory_items)
        optional_subtotal = sum(item.line_total for item in selected_optional_items)
        total_subtotal = base_subtotal + optional_subtotal
        
        # Assertions
        assert base_subtotal == Decimal("1000.0")  # Only mandatory item
        assert optional_subtotal == Decimal("550.0")  # Standard material + Extra service
        assert total_subtotal == Decimal("1550.0")

    def test_group_exclusion_logic(self, sample_items):
        """Test that selecting one item in a group excludes others."""
        
        # Simulate materials group
        materials_group = [item for item in sample_items if item.option_group == "materials"]
        
        # Select premium material
        selected_material_id = "item-3"
        other_material_ids = [item.id for item in materials_group if item.id != selected_material_id]
        
        # Verify exclusion
        assert len(materials_group) == 2
        assert "item-2" in other_material_ids  # Standard material
        assert "item-3" not in other_material_ids  # Premium material (selected)
        
        # This simulates the radio button behavior
        # Only one item in the group can be selected at a time


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
