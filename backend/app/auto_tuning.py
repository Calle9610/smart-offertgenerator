"""
Auto-tuning system for quote generation.

Learns from user adjustments to improve future auto-generation accuracy.
Uses pattern recognition to adjust quantities and prices based on historical data.
"""

import uuid
from decimal import Decimal
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from . import models, schemas


class AutoTuningEngine:
    """
    Engine for learning from user adjustments and improving quote generation.

    Analyzes adjustment patterns to create tuning factors that improve
    future auto-generation accuracy.
    """

    def __init__(self, db: Session, company_id: uuid.UUID):
        """
        Initialize auto-tuning engine.

        Args:
            db: Database session
            company_id: Company ID for multi-tenant isolation
        """
        self.db = db
        self.company_id = company_id

    def log_adjustment(
        self,
        quote_id: uuid.UUID,
        user_id: uuid.UUID,
        item_ref: str,
        item_kind: str,
        original_qty: Decimal,
        adjusted_qty: Decimal,
        original_unit_price: Decimal,
        adjusted_unit_price: Decimal,
        adjustment_reason: Optional[str] = None,
    ) -> None:
        """
        Log a user adjustment for auto-tuning analysis.

        Args:
            quote_id: ID of the quote being adjusted
            user_id: ID of the user making the adjustment
            item_ref: Reference code for the adjusted item
            item_kind: Type of item (labor, material, custom)
            original_qty: Original quantity from auto-generation
            adjusted_qty: New quantity after user adjustment
            original_unit_price: Original unit price
            adjusted_unit_price: New unit price
            adjustment_reason: Optional reason for the adjustment
        """
        # Get quote and project requirements for pattern analysis
        quote = self.db.query(models.Quote).filter(
            models.Quote.id == quote_id,
            models.Quote.company_id == self.company_id
        ).first()

        if not quote:
            return

        # Log the adjustment
        adjustment_log = models.QuoteAdjustmentLog(
            quote_id=quote_id,
            company_id=self.company_id,
            user_id=user_id,
            item_ref=item_ref,
            item_kind=item_kind,
            original_qty=original_qty,
            adjusted_qty=adjusted_qty,
            original_unit_price=original_unit_price,
            adjusted_unit_price=adjusted_unit_price,
            adjustment_reason=adjustment_reason,
        )

        self.db.add(adjustment_log)
        self.db.flush()

        # Update auto-tuning patterns
        self._update_tuning_patterns(
            quote_id, item_ref, original_qty, adjusted_qty
        )

    def _update_tuning_patterns(
        self,
        quote_id: uuid.UUID,
        item_ref: str,
        original_qty: Decimal,
        adjusted_qty: Decimal,
    ) -> None:
        """
        Update auto-tuning patterns based on user adjustment.

        Args:
            quote_id: ID of the quote
            item_ref: Reference code for the adjusted item
            original_qty: Original quantity
            adjusted_qty: Adjusted quantity
        """
        # Get project requirements for pattern key
        requirements = self.db.query(models.ProjectRequirements).filter(
            models.ProjectRequirements.quote_id == quote_id,
            models.ProjectRequirements.company_id == self.company_id
        ).first()

        if not requirements or not requirements.data:
            return

        # Build pattern key: "roomType|finishLevel|itemRef"
        room_type = requirements.data.get("room_type", "unknown")
        finish_level = requirements.data.get("finish_level", "unknown")
        pattern_key = f"{room_type}|{finish_level}|{item_ref}"

        # Calculate adjustment factor
        if original_qty > 0:
            adjustment_factor = float(adjusted_qty / original_qty)
        else:
            adjustment_factor = 1.0

        # Find existing pattern or create new one
        pattern = self.db.query(models.AutoTuningPattern).filter(
            models.AutoTuningPattern.company_id == self.company_id,
            models.AutoTuningPattern.pattern_key == pattern_key
        ).first()

        if pattern:
            # Update existing pattern with weighted average
            old_factor = float(pattern.adjustment_factor)
            old_confidence = float(pattern.confidence_score)
            old_samples = pattern.sample_count

            # Weighted average: newer samples have more influence
            new_factor = (old_factor * old_samples + adjustment_factor) / (old_samples + 1)

            # Increase confidence with more samples (capped at 0.95)
            new_confidence = min(0.95, old_confidence + 0.05)

            pattern.adjustment_factor = Decimal(str(new_factor))
            pattern.confidence_score = Decimal(str(new_confidence))
            pattern.sample_count += 1
            pattern.last_adjusted_at = models.func.now()
        else:
            # Create new pattern
            new_pattern = models.AutoTuningPattern(
                company_id=self.company_id,
                pattern_key=pattern_key,
                adjustment_factor=Decimal(str(adjustment_factor)),
                confidence_score=Decimal("0.7"),  # Initial confidence
                sample_count=1,
            )
            self.db.add(new_pattern)

        self.db.commit()

    def apply_tuning_to_generation(
        self,
        requirements: schemas.ProjectRequirementsIn,
        generated_items: List[Dict],
    ) -> List[Dict]:
        """
        Apply auto-tuning factors to generated quote items.

        Args:
            requirements: Project requirements used for generation
            generated_items: List of auto-generated items

        Returns:
            List of items with auto-tuning applied
        """
        tuned_items = []

        for item in generated_items:
            item_ref = item.get("ref", "")
            if not item_ref:
                tuned_items.append(item)
                continue

            # Build pattern key
            pattern_key = f"{requirements.room_type.value}|{requirements.finish_level.value}|{item_ref}"

            # Find tuning pattern
            pattern = self.db.query(models.AutoTuningPattern).filter(
                models.AutoTuningPattern.company_id == self.company_id,
                models.AutoTuningPattern.pattern_key == pattern_key
            ).first()

            if pattern and pattern.confidence_score > 0.6:  # Only apply if confident enough
                # Apply tuning factor to quantity
                original_qty = item.get("qty", 0)
                if isinstance(original_qty, (int, float, Decimal)):
                    tuned_qty = float(original_qty) * float(pattern.adjustment_factor)
                    item["qty"] = tuned_qty
                    item["line_total"] = tuned_qty * item.get("unit_price", 0)

                    # Add confidence indicator
                    item["tuning_confidence"] = float(pattern.confidence_score)
                    item["tuning_factor"] = float(pattern.adjustment_factor)

            tuned_items.append(item)

        return tuned_items

    def get_tuning_insights(self) -> List[Dict]:
        """
        Get insights about auto-tuning patterns for analytics.

        Returns:
            List of tuning pattern insights
        """
        patterns = self.db.query(models.AutoTuningPattern).filter(
            models.AutoTuningPattern.company_id == self.company_id
        ).order_by(models.AutoTuningPattern.confidence_score.desc()).all()

        insights = []
        for pattern in patterns:
            room_type, finish_level, item_ref = pattern.pattern_key.split("|", 2)

            insight = {
                "pattern_key": pattern.pattern_key,
                "room_type": room_type,
                "finish_level": finish_level,
                "item_ref": item_ref,
                "adjustment_factor": float(pattern.adjustment_factor),
                "confidence_score": float(pattern.confidence_score),
                "sample_count": pattern.sample_count,
                "last_adjusted": pattern.last_adjusted_at.isoformat() if pattern.last_adjusted_at else None,
                "interpretation": self._interpret_factor(pattern.adjustment_factor),
            }
            insights.append(insight)

        return insights

    def _interpret_factor(self, factor: Decimal) -> str:
        """
        Interpret adjustment factor for human readability.

        Args:
            factor: Adjustment factor

        Returns:
            Human-readable interpretation
        """
        factor_float = float(factor)

        if factor_float > 1.5:
            return "Systemet underskattar kraftigt - behöver öka med {:.0%}".format(factor_float - 1)
        elif factor_float > 1.2:
            return "Systemet underskattar - behöver öka med {:.0%}".format(factor_float - 1)
        elif factor_float > 0.9:
            return "Systemet är ganska precis"
        elif factor_float > 0.7:
            return "Systemet överskattar - behöver minska med {:.0%}".format(1 - factor_float)
        else:
            return "Systemet överskattar kraftigt - behöver minska med {:.0%}".format(1 - factor_float)


def create_auto_tuning_engine(db: Session, company_id: uuid.UUID) -> AutoTuningEngine:
    """
    Factory function to create auto-tuning engine.

    Args:
        db: Database session
        company_id: Company ID for multi-tenant isolation

    Returns:
        Configured AutoTuningEngine instance
    """
    return AutoTuningEngine(db, company_id) 
