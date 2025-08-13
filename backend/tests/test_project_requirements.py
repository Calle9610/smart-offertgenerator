from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import FinishLevel, ProjectRequirementsIn, RoomType

client = TestClient(app)


class TestProjectRequirementsEndpoints:
    """Test project requirements endpoints with multi-tenant security."""

    def test_create_project_requirements_without_auth(self):
        """Test that project requirements creation requires authentication."""
        requirements_data = {
            "room_type": "bathroom",
            "area_m2": 15.5,
            "finish_level": "standard",
            "has_plumbing_work": True,
            "has_electrical_work": False,
            "material_prefs": ["tiles", "granite"],
            "site_constraints": ["limited access"],
            "notes": "Test bathroom renovation",
        }

        response = client.post("/project-requirements", json=requirements_data)
        assert response.status_code == 401  # Unauthorized

    def test_get_project_requirements_without_auth(self):
        """Test that getting project requirements requires authentication."""
        response = client.get("/project-requirements")
        assert response.status_code == 401  # Unauthorized

    def test_get_project_requirements_by_id_without_auth(self):
        """Test that getting specific project requirements requires authentication."""
        response = client.get(f"/project-requirements/{uuid4()}")
        assert response.status_code == 401  # Unauthorized

    def test_update_project_requirements_without_auth(self):
        """Test that updating project requirements requires authentication."""
        requirements_data = {
            "room_type": "kitchen",
            "area_m2": 20.0,
            "finish_level": "premium",
            "has_plumbing_work": True,
            "has_electrical_work": True,
            "material_prefs": ["marble", "stainless steel"],
            "site_constraints": [],
            "notes": "Updated kitchen requirements",
        }

        response = client.put(
            f"/project-requirements/{uuid4()}", json=requirements_data
        )
        assert response.status_code == 401  # Unauthorized

    def test_delete_project_requirements_without_auth(self):
        """Test that deleting project requirements requires authentication."""
        response = client.delete(f"/project-requirements/{uuid4()}")
        assert response.status_code == 401  # Unauthorized

    def test_get_project_requirements_by_quote_without_auth(self):
        """Test that getting project requirements by quote requires authentication."""
        response = client.get(f"/quotes/{uuid4()}/project-requirements")
        assert response.status_code == 401  # Unauthorized


class TestProjectRequirementsValidation:
    """Test project requirements data validation."""

    def test_valid_project_requirements_schema(self):
        """Test that valid project requirements data passes validation."""
        requirements = ProjectRequirementsIn(
            room_type=RoomType.BATHROOM,
            area_m2=Decimal("15.5"),
            finish_level=FinishLevel.STANDARD,
            has_plumbing_work=True,
            has_electrical_work=False,
            material_prefs=["tiles", "granite"],
            site_constraints=["limited access"],
            notes="Test bathroom renovation",
        )

        assert requirements.room_type == RoomType.BATHROOM
        assert requirements.area_m2 == Decimal("15.5")
        assert requirements.finish_level == FinishLevel.STANDARD
        assert requirements.has_plumbing_work is True
        assert requirements.has_electrical_work is False
        assert requirements.material_prefs == ["tiles", "granite"]
        assert requirements.site_constraints == ["limited access"]
        assert requirements.notes == "Test bathroom renovation"

    def test_invalid_room_type(self):
        """Test that invalid room type raises validation error."""
        with pytest.raises(ValueError):
            ProjectRequirementsIn(
                room_type="invalid_room",  # Invalid room type
                area_m2=Decimal("15.5"),
                finish_level=FinishLevel.STANDARD,
                has_plumbing_work=True,
                has_electrical_work=False,
                material_prefs=[],
                site_constraints=[],
                notes=None,
            )

    def test_invalid_finish_level(self):
        """Test that invalid finish level raises validation error."""
        with pytest.raises(ValueError):
            ProjectRequirementsIn(
                room_type=RoomType.BATHROOM,
                area_m2=Decimal("15.5"),
                finish_level="invalid_level",  # Invalid finish level
                has_plumbing_work=True,
                has_electrical_work=False,
                material_prefs=[],
                site_constraints=[],
                notes=None,
            )

    def test_invalid_area_negative(self):
        """Test that negative area raises validation error."""
        with pytest.raises(ValueError):
            ProjectRequirementsIn(
                room_type=RoomType.BATHROOM,
                area_m2=Decimal("-5.0"),  # Negative area
                finish_level=FinishLevel.STANDARD,
                has_plumbing_work=True,
                has_electrical_work=False,
                material_prefs=[],
                site_constraints=[],
                notes=None,
            )

    def test_invalid_area_zero(self):
        """Test that zero area raises validation error."""
        with pytest.raises(ValueError):
            ProjectRequirementsIn(
                room_type=RoomType.BATHROOM,
                area_m2=Decimal("0.0"),  # Zero area
                finish_level=FinishLevel.STANDARD,
                has_plumbing_work=True,
                has_electrical_work=False,
                material_prefs=[],
                site_constraints=[],
                notes=None,
            )

    def test_area_too_large(self):
        """Test that extremely large area raises validation error."""
        with pytest.raises(ValueError):
            ProjectRequirementsIn(
                room_type=RoomType.BATHROOM,
                area_m2=Decimal("15000.0"),  # Too large area
                finish_level=FinishLevel.STANDARD,
                has_plumbing_work=True,
                has_electrical_work=False,
                material_prefs=[],
                site_constraints=[],
                notes=None,
            )

    def test_material_prefs_too_long(self):
        """Test that extremely long material preferences list raises validation error."""
        long_list = [f"material_{i}" for i in range(51)]  # 51 items

        with pytest.raises(ValueError):
            ProjectRequirementsIn(
                room_type=RoomType.BATHROOM,
                area_m2=Decimal("15.5"),
                finish_level=FinishLevel.STANDARD,
                has_plumbing_work=True,
                has_electrical_work=False,
                material_prefs=long_list,  # Too many items
                site_constraints=[],
                notes=None,
            )

    def test_site_constraints_too_long(self):
        """Test that extremely long site constraints list raises validation error."""
        long_list = [f"constraint_{i}" for i in range(51)]  # 51 items

        with pytest.raises(ValueError):
            ProjectRequirementsIn(
                room_type=RoomType.BATHROOM,
                area_m2=Decimal("15.5"),
                finish_level=FinishLevel.STANDARD,
                has_plumbing_work=True,
                has_electrical_work=False,
                material_prefs=[],
                site_constraints=long_list,  # Too many items
                notes=None,
            )

    def test_notes_too_long(self):
        """Test that extremely long notes raises validation error."""
        long_notes = "x" * 2001  # 2001 characters

        with pytest.raises(ValueError):
            ProjectRequirementsIn(
                room_type=RoomType.BATHROOM,
                area_m2=Decimal("15.5"),
                finish_level=FinishLevel.STANDARD,
                has_plumbing_work=True,
                has_electrical_work=False,
                material_prefs=[],
                site_constraints=[],
                notes=long_notes,  # Too long notes
            )

    def test_valid_edge_cases(self):
        """Test valid edge cases for project requirements."""
        # Minimum valid requirements
        minimal_requirements = ProjectRequirementsIn(
            room_type=RoomType.KITCHEN,
            area_m2=Decimal("0.1"),  # Very small but valid
            finish_level=FinishLevel.BASIC,
            has_plumbing_work=False,
            has_electrical_work=False,
            material_prefs=[],  # Empty lists
            site_constraints=[],
            notes=None,  # No notes
        )

        assert minimal_requirements.room_type == RoomType.KITCHEN
        assert float(minimal_requirements.area_m2) == 0.1
        assert minimal_requirements.finish_level == FinishLevel.BASIC
        assert minimal_requirements.material_prefs == []
        assert minimal_requirements.site_constraints == []
        assert minimal_requirements.notes is None

        # Maximum valid requirements
        maximal_requirements = ProjectRequirementsIn(
            room_type=RoomType.FLOORING,
            area_m2=Decimal("9999.99"),  # Large but valid
            finish_level=FinishLevel.PREMIUM,
            has_plumbing_work=True,
            has_electrical_work=True,
            material_prefs=["material_1"] * 50,  # Maximum items
            site_constraints=["constraint_1"] * 50,  # Maximum items
            notes="x" * 2000,  # Maximum length notes
        )

        assert maximal_requirements.room_type == RoomType.FLOORING
        assert float(maximal_requirements.area_m2) == 9999.99
        assert maximal_requirements.finish_level == FinishLevel.PREMIUM
        assert len(maximal_requirements.material_prefs) == 50
        assert len(maximal_requirements.site_constraints) == 50
        assert len(maximal_requirements.notes) == 2000


class TestProjectRequirementsEnums:
    """Test project requirements enum values."""

    def test_room_type_values(self):
        """Test that room type enum has correct values."""
        assert RoomType.BATHROOM == "bathroom"
        assert RoomType.KITCHEN == "kitchen"
        assert RoomType.FLOORING == "flooring"

        # Test enum membership using proper enum values
        assert RoomType.BATHROOM in RoomType
        assert RoomType.KITCHEN in RoomType
        assert RoomType.FLOORING in RoomType

        # Test that invalid values are not in enum
        assert "invalid" not in [e.value for e in RoomType]

    def test_finish_level_values(self):
        """Test that finish level enum has correct values."""
        assert FinishLevel.BASIC == "basic"
        assert FinishLevel.STANDARD == "standard"
        assert FinishLevel.PREMIUM == "premium"

        # Test enum membership using proper enum values
        assert FinishLevel.BASIC in FinishLevel
        assert FinishLevel.STANDARD in FinishLevel
        assert FinishLevel.PREMIUM in FinishLevel

        # Test that invalid values are not in enum
        assert "invalid" not in [e.value for e in FinishLevel]
