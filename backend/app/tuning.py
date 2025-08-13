"""
Tuning helper module for updating tuning statistics.

Handles logging user adjustments and updating tuning patterns.
"""

import uuid
from decimal import Decimal
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from . import crud, schemas
from .models import QuoteAdjustmentLog, TuningStat, GenerationRule


class TuningHelper:
    """
    Helper class for managing tuning statistics and adjustment logging.
    
    Handles:
    - Logging user adjustments to quote items
    - Updating tuning statistics with rolling median
    - Maintaining tuning samples for accurate calculations
    """
    
    def __init__(self, db: Session, company_id: uuid.UUID):
        """
        Initialize tuning helper.
        
        Args:
            db: Database session
            company_id: Company ID for multi-tenancy
        """
        self.db = db
        self.company_id = company_id
    
    def log_adjustment_and_update_tuning(
        self,
        quote_id: uuid.UUID,
        item_ref: str,
        old_qty: Decimal,
        new_qty: Decimal,
        room_type: str,
        finish_level: str,
        adjustment_reason: Optional[str] = None
    ) -> None:
        """
        Log a user adjustment and update tuning statistics.
        
        Args:
            quote_id: ID of the quote being adjusted
            item_ref: Reference code for the adjusted item
            old_qty: Original quantity from auto-generation
            new_qty: New quantity after user adjustment
            room_type: Room type from project requirements
            finish_level: Finish level from project requirements
            adjustment_reason: Optional reason for the adjustment
        """
        # Calculate adjustment factor
        if old_qty == 0:
            adjustment_factor = Decimal('1.0')  # Default if original was 0
        else:
            adjustment_factor = new_qty / old_qty
        
        # Clamp adjustment factor to [0.8, 1.2]
        clamped_factor = max(Decimal('0.8'), min(Decimal('1.2'), adjustment_factor))
        
        # Build rule key
        rule_key = f"{room_type}|{finish_level}"
        
        # Log the adjustment
        adjustment_log = crud.create_quote_adjustment_log(
            self.db,
            schemas.QuoteAdjustmentLogCreate(
                quote_id=quote_id,
                item_ref=item_ref,
                old_qty=old_qty,
                new_qty=new_qty,
                reason=adjustment_reason
            )
        )
        
        if adjustment_log:
            # Update tuning statistics
            self._update_tuning_statistics(rule_key, item_ref, clamped_factor)
    
    def _update_tuning_statistics(self, rule_key: str, item_ref: str, adjustment_factor: Decimal) -> None:
        """
        Update tuning statistics for a specific rule key and item reference.
        
        Args:
            rule_key: Rule key in format "roomType|finishLevel"
            item_ref: Item reference code
            adjustment_factor: Clamped adjustment factor
        """
        # Get existing tuning stat
        existing_stat = crud.get_tuning_stat_by_key_and_item(
            self.db, self.company_id, rule_key, item_ref
        )
        
        if existing_stat:
            # Update existing stat with new factor
            self._update_existing_tuning_stat(existing_stat, adjustment_factor)
        else:
            # Create new tuning stat
            self._create_new_tuning_stat(rule_key, item_ref, adjustment_factor)
    
    def _update_existing_tuning_stat(self, stat: TuningStat, new_factor: Decimal) -> None:
        """
        Update existing tuning stat with new adjustment factor.
        
        Args:
            stat: Existing tuning stat record
            new_factor: New adjustment factor to incorporate
        """
        # Get recent adjustments for this item to calculate rolling median
        recent_adjustments = self._get_recent_adjustments(stat.key, stat.item_ref)
        
        # Add new factor to recent adjustments
        recent_adjustments.append(float(new_factor))
        
        # Keep only last 50 adjustments
        if len(recent_adjustments) > 50:
            recent_adjustments = recent_adjustments[-50:]
        
        # Calculate new median
        sorted_factors = sorted(recent_adjustments)
        n = len(sorted_factors)
        
        if n % 2 == 0:
            # Even number of factors
            median = (sorted_factors[n//2 - 1] + sorted_factors[n//2]) / 2
        else:
            # Odd number of factors
            median = sorted_factors[n//2]
        
        # Update the stat
        stat.median_factor = Decimal(str(median))
        stat.n = n
        stat.updated_at = func.now()
        
        self.db.commit()
    
    def _create_new_tuning_stat(self, rule_key: str, item_ref: str, adjustment_factor: Decimal) -> None:
        """
        Create new tuning stat record.
        
        Args:
            rule_key: Rule key in format "roomType|finishLevel"
            item_ref: Item reference code
            adjustment_factor: First adjustment factor
        """
        new_stat = TuningStat(
            company_id=self.company_id,
            key=rule_key,
            item_ref=item_ref,
            median_factor=adjustment_factor,
            n=1
        )
        
        self.db.add(new_stat)
        self.db.commit()
        self.db.refresh(new_stat)
    
    def _get_recent_adjustments(self, rule_key: str, item_ref: str) -> List[float]:
        """
        Get recent adjustment factors for calculating rolling median.
        
        Args:
            rule_key: Rule key in format "roomType|finishLevel"
            item_ref: Item reference code
            
        Returns:
            List of recent adjustment factors
        """
        # Get recent adjustments from the log
        recent_logs = (
            self.db.query(QuoteAdjustmentLog)
            .join(QuoteAdjustmentLog.quote)
            .filter(
                QuoteAdjustmentLog.item_ref == item_ref,
                QuoteAdjustmentLog.quote.has(company_id=self.company_id)
            )
            .order_by(QuoteAdjustmentLog.created_at.desc())
            .limit(50)
            .all()
        )
        
        # Extract adjustment factors
        factors = []
        for log in recent_logs:
            if log.old_qty > 0:
                factor = log.new_qty / log.old_qty
                # Clamp factor to [0.8, 1.2] to match our limits
                clamped_factor = max(Decimal('0.8'), min(Decimal('1.2'), factor))
                factors.append(float(clamped_factor))
        
        return factors
    
    def get_tuning_insights(self, rule_key: str) -> Dict[str, any]:
        """
        Get tuning insights for a specific rule key.
        
        Args:
            rule_key: Rule key in format "roomType|finishLevel"
            
        Returns:
            Dictionary with tuning insights
        """
        # Get all tuning stats for this rule key
        tuning_stats = crud.get_tuning_stats_by_company(self.db, self.company_id)
        rule_stats = [stat for stat in tuning_stats if stat.key == rule_key]
        
        insights = {
            "rule_key": rule_key,
            "total_items": len(rule_stats),
            "high_confidence_items": 0,
            "medium_confidence_items": 0,
            "low_confidence_items": 0,
            "items": []
        }
        
        for stat in rule_stats:
            # Determine confidence level
            if stat.n >= 10:
                confidence = "high"
                insights["high_confidence_items"] += 1
            elif stat.n >= 5:
                confidence = "medium"
                insights["medium_confidence_items"] += 1
            else:
                confidence = "low"
                insights["low_confidence_items"] += 1
            
            # Get interpretation
            interpretation = self._interpret_factor(stat.median_factor, stat.n)
            
            insights["items"].append({
                "item_ref": stat.item_ref,
                "median_factor": float(stat.median_factor),
                "sample_count": stat.n,
                "confidence": confidence,
                "interpretation": interpretation,
                "last_updated": stat.updated_at.isoformat() if stat.updated_at else None
            })
        
        return insights
    
    def _interpret_factor(self, factor: Decimal, sample_count: int) -> str:
        """
        Provide human-readable interpretation of adjustment factor.
        
        Args:
            factor: Adjustment factor
            sample_count: Number of samples
            
        Returns:
            Human-readable interpretation
        """
        if factor > Decimal('1.1'):
            direction = "högre"
            percentage = f"{((factor - 1) * 100):.0f}%"
        elif factor < Decimal('0.9'):
            direction = "lägre"
            percentage = f"{((1 - factor) * 100):.0f}%"
        else:
            direction = "ungefär samma"
            percentage = "±10%"
        
        if sample_count >= 10:
            reliability = "hög tillförlitlighet"
        elif sample_count >= 5:
            reliability = "medel tillförlitlighet"
        else:
            reliability = "låg tillförlitlighet"
        
        return f"Användare justerar vanligtvis till {direction} kvantitet ({percentage}) med {reliability}"


def create_tuning_helper(db: Session, company_id: uuid.UUID) -> TuningHelper:
    """
    Factory function to create a TuningHelper instance.
    
    Args:
        db: Database session
        company_id: Company ID for multi-tenancy
        
    Returns:
        Configured TuningHelper instance
    """
    return TuningHelper(db, company_id)
