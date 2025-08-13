"""
Tests for auto-tuning functionality.

Tests the AutoTuningEngine, adjustment logging, pattern learning,
and confidence scoring functionality.
"""

import uuid
from decimal import Decimal
from unittest.mock import Mock, patch

import pytest
from sqlalchemy.orm import Session

from app.auto_tuning import AutoTuningEngine
from app.models import AutoTuningPattern, QuoteAdjustmentLog
from app.schemas import ProjectRequirementsIn, RoomType, FinishLevel


class TestAutoTuningEngine:
    """Test the AutoTuningEngine functionality."""

    def test_init(self):
        """Test engine initialization."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        assert engine.db == mock_db
        assert engine.company_id == company_id

    def test_log_adjustment(self):
        """Test logging user adjustments."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        quote_id = uuid.uuid4()
        user_id = uuid.uuid4()
        
        # Mock quote query
        mock_quote = Mock()
        mock_quote.id = quote_id
        mock_db.query.return_value.filter.return_value.first.return_value = mock_quote
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        engine.log_adjustment(
            quote_id=quote_id,
            user_id=user_id,
            item_ref="SNICK",
            item_kind="labor",
            original_qty=Decimal("8.0"),
            adjusted_qty=Decimal("10.0"),
            original_unit_price=Decimal("650.00"),
            adjusted_unit_price=Decimal("650.00"),
            adjustment_reason="Test adjustment"
        )
        
        # Verify adjustment log was created
        mock_db.add.assert_called()
        mock_db.flush.assert_called()
        mock_db.commit.assert_called()

    def test_update_tuning_patterns_new_pattern(self):
        """Test creating new tuning patterns."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        quote_id = uuid.uuid4()
        
        # Mock project requirements query
        mock_requirements = Mock()
        mock_requirements.data = {
            "room_type": "bathroom",
            "finish_level": "premium"
        }
        mock_db.query.return_value.filter.return_value.first.return_value = mock_requirements
        
        # Mock pattern query (no existing pattern)
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        engine._update_tuning_patterns(
            quote_id, "SNICK", Decimal("8.0"), Decimal("10.0")
        )
        
        # Verify new pattern was created
        mock_db.add.assert_called()
        mock_db.commit.assert_called()

    def test_update_tuning_patterns_existing_pattern(self):
        """Test updating existing tuning patterns."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        quote_id = uuid.uuid4()
        
        # Mock project requirements query
        mock_requirements = Mock()
        mock_requirements.data = {
            "room_type": "bathroom",
            "finish_level": "premium"
        }
        mock_db.query.return_value.filter.return_value.first.return_value = mock_requirements
        
        # Mock existing pattern
        mock_pattern = Mock()
        mock_pattern.adjustment_factor = Decimal("1.0")
        mock_pattern.confidence_score = Decimal("0.7")
        mock_pattern.sample_count = 3
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pattern
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        engine._update_tuning_patterns(
            quote_id, "SNICK", Decimal("8.0"), Decimal("10.0")
        )
        
        # Verify pattern was updated
        assert mock_pattern.adjustment_factor != Decimal("1.0")
        assert mock_pattern.confidence_score > Decimal("0.7")
        assert mock_pattern.sample_count == 4
        mock_db.commit.assert_called()

    def test_apply_tuning_to_generation(self):
        """Test applying auto-tuning to generated items."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        # Mock tuning pattern
        mock_pattern = Mock()
        mock_pattern.confidence_score = Decimal("0.8")
        mock_pattern.adjustment_factor = Decimal("1.2")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pattern
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        requirements = ProjectRequirementsIn(
            room_type=RoomType.BATHROOM,
            area_m2=15.0,
            finish_level=FinishLevel.PREMIUM,
            has_plumbing_work=True,
            has_electrical_work=False,
            material_prefs=[],
            site_constraints=[],
            notes=""
        )
        
        generated_items = [
            {
                "kind": "labor",
                "ref": "SNICK",
                "description": "Snickeri",
                "qty": 8.0,
                "unit": "hour",
                "unit_price": 650.0,
                "line_total": 5200.0
            }
        ]
        
        tuned_items = engine.apply_tuning_to_generation(requirements, generated_items)
        
        # Verify tuning was applied
        assert len(tuned_items) == 1
        assert tuned_items[0]["qty"] == 9.6  # 8.0 * 1.2
        assert tuned_items[0]["line_total"] == 6240.0  # 9.6 * 650.0
        assert "tuning_confidence" in tuned_items[0]
        assert "tuning_factor" in tuned_items[0]

    def test_apply_tuning_no_pattern(self):
        """Test applying tuning when no pattern exists."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        # Mock no pattern found
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        requirements = ProjectRequirementsIn(
            room_type=RoomType.BATHROOM,
            area_m2=15.0,
            finish_level=FinishLevel.PREMIUM,
            has_plumbing_work=True,
            has_electrical_work=False,
            material_prefs=[],
            site_constraints=[],
            notes=""
        )
        
        generated_items = [
            {
                "kind": "labor",
                "ref": "SNICK",
                "description": "Snickeri",
                "qty": 8.0,
                "unit": "hour",
                "unit_price": 650.0,
                "line_total": 5200.0
            }
        ]
        
        tuned_items = engine.apply_tuning_to_generation(requirements, generated_items)
        
        # Verify no tuning was applied
        assert len(tuned_items) == 1
        assert tuned_items[0]["qty"] == 8.0  # Unchanged
        assert "tuning_confidence" not in tuned_items[0]

    def test_apply_tuning_low_confidence(self):
        """Test that tuning is not applied for low confidence patterns."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        # Mock low confidence pattern
        mock_pattern = Mock()
        mock_pattern.confidence_score = Decimal("0.5")  # Below threshold
        mock_pattern.adjustment_factor = Decimal("1.2")
        mock_db.query.return_value.filter.return_value.first.return_value = mock_pattern
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        requirements = ProjectRequirementsIn(
            room_type=RoomType.BATHROOM,
            area_m2=15.0,
            finish_level=FinishLevel.PREMIUM,
            has_plumbing_work=True,
            has_electrical_work=False,
            material_prefs=[],
            site_constraints=[],
            notes=""
        )
        
        generated_items = [
            {
                "kind": "labor",
                "ref": "SNICK",
                "description": "Snickeri",
                "qty": 8.0,
                "unit": "hour",
                "unit_price": 650.0,
                "line_total": 5200.0
            }
        ]
        
        tuned_items = engine.apply_tuning_to_generation(requirements, generated_items)
        
        # Verify no tuning was applied due to low confidence
        assert len(tuned_items) == 1
        assert tuned_items[0]["qty"] == 8.0  # Unchanged
        assert "tuning_confidence" not in tuned_items[0]

    def test_get_tuning_insights(self):
        """Test retrieving tuning insights."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        # Mock patterns
        mock_patterns = [
            Mock(
                pattern_key="bathroom|premium|SNICK",
                adjustment_factor=Decimal("1.2"),
                confidence_score=Decimal("0.8"),
                sample_count=5,
                last_adjusted_at=None
            ),
            Mock(
                pattern_key="kitchen|standard|KAKEL20",
                adjustment_factor=Decimal("0.9"),
                confidence_score=Decimal("0.7"),
                sample_count=3,
                last_adjusted_at=None
            )
        ]
        
        mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = mock_patterns
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        insights = engine.get_tuning_insights()
        
        # Verify insights structure
        assert len(insights) == 2
        assert insights[0]["pattern_key"] == "bathroom|premium|SNICK"
        assert insights[0]["adjustment_factor"] == 1.2
        assert insights[0]["confidence_score"] == 0.8
        assert insights[0]["sample_count"] == 5
        assert "interpretation" in insights[0]

    def test_interpret_factor(self):
        """Test factor interpretation for human readability."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        # Test various factors
        assert "underskattar kraftigt" in engine._interpret_factor(Decimal("1.6"))
        assert "underskattar" in engine._interpret_factor(Decimal("1.3"))
        assert "ganska precis" in engine._interpret_factor(Decimal("1.0"))
        assert "överskattar" in engine._interpret_factor(Decimal("0.8"))
        assert "överskattar kraftigt" in engine._interpret_factor(Decimal("0.4"))

    def test_adjustment_factor_calculation(self):
        """Test adjustment factor calculation logic."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        # Test normal case
        factor = engine._calculate_adjustment_factor(Decimal("8.0"), Decimal("10.0"))
        assert factor == 1.25  # 10/8
        
        # Test zero original quantity
        factor = engine._calculate_adjustment_factor(Decimal("0.0"), Decimal("5.0"))
        assert factor == 1.0  # Default fallback
        
        # Test negative quantities
        factor = engine._calculate_adjustment_factor(Decimal("-2.0"), Decimal("4.0"))
        assert factor == 1.0  # Default fallback

    def _calculate_adjustment_factor(self, original_qty: Decimal, adjusted_qty: Decimal) -> float:
        """Helper method to test adjustment factor calculation."""
        if original_qty > 0:
            return float(adjusted_qty / original_qty)
        else:
            return 1.0


class TestAutoTuningIntegration:
    """Integration tests for auto-tuning functionality."""

    @pytest.fixture
    def sample_requirements(self):
        """Sample project requirements for testing."""
        return ProjectRequirementsIn(
            room_type=RoomType.BATHROOM,
            area_m2=15.0,
            finish_level=FinishLevel.PREMIUM,
            has_plumbing_work=True,
            has_electrical_work=False,
            material_prefs=[],
            site_constraints=[],
            notes="Test bathroom"
        )

    def test_complete_auto_tuning_flow(self, sample_requirements):
        """Test complete auto-tuning flow from adjustment to generation."""
        # This would be an integration test with real database
        # For now, we'll test the flow logic
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        # Simulate adjustment logging
        engine.log_adjustment(
            quote_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            item_ref="SNICK",
            item_kind="labor",
            original_qty=Decimal("8.0"),
            adjusted_qty=Decimal("10.0"),
            original_unit_price=Decimal("650.00"),
            adjusted_unit_price=Decimal("650.00"),
            adjustment_reason="Integration test"
        )
        
        # Verify the flow completed without errors
        assert True  # If we get here, no exceptions were raised

    def test_multi_item_tuning(self, sample_requirements):
        """Test tuning multiple items simultaneously."""
        mock_db = Mock()
        company_id = uuid.uuid4()
        
        # Mock multiple patterns
        mock_patterns = [
            Mock(
                pattern_key="bathroom|premium|SNICK",
                confidence_score=Decimal("0.8"),
                adjustment_factor=Decimal("1.2")
            ),
            Mock(
                pattern_key="bathroom|premium|VVS",
                confidence_score=Decimal("0.9"),
                adjustment_factor=Decimal("0.9")
            )
        ]
        
        # Mock pattern queries
        def mock_pattern_query(*args, **kwargs):
            mock_query = Mock()
            mock_query.filter.return_value.first.side_effect = mock_patterns
            return mock_query
        
        mock_db.query.side_effect = mock_pattern_query
        
        engine = AutoTuningEngine(mock_db, company_id)
        
        generated_items = [
            {
                "kind": "labor",
                "ref": "SNICK",
                "qty": 8.0,
                "unit_price": 650.0,
                "line_total": 5200.0
            },
            {
                "kind": "labor",
                "ref": "VVS",
                "qty": 6.0,
                "unit_price": 750.0,
                "line_total": 4500.0
            }
        ]
        
        tuned_items = engine.apply_tuning_to_generation(sample_requirements, generated_items)
        
        # Verify both items were tuned
        assert len(tuned_items) == 2
        assert tuned_items[0]["qty"] == 9.6  # 8.0 * 1.2
        assert tuned_items[1]["qty"] == 5.4  # 6.0 * 0.9


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 
