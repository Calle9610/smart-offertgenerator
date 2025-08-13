"""Add quote adjustments and auto-tuning tables

Revision ID: 004
Revises: 003
Create Date: 2025-01-13 17:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
depends_on = None


def upgrade():
    """Create quote adjustments and auto-tuning tables."""
    
    # Create quote_adjustment_log table
    op.create_table(
        'quote_adjustment_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('item_ref', sa.String(), nullable=False),
        sa.Column('item_kind', sa.String(), nullable=False),  # labor, material, custom
        sa.Column('original_qty', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('adjusted_qty', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('original_unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('adjusted_unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('adjustment_reason', sa.String(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['quote_id'], ['quote.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE')
    )
    
    # Create auto_tuning_patterns table
    op.create_table(
        'auto_tuning_patterns',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('pattern_key', sa.String(), nullable=False),  # Format: "roomType|finishLevel|itemRef"
        sa.Column('adjustment_factor', sa.Numeric(precision=8, scale=4), nullable=False),  # Multiplier for quantities
        sa.Column('confidence_score', sa.Numeric(precision=5, scale=4), nullable=False),  # 0.0-1.0
        sa.Column('sample_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_adjusted_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('company_id', 'pattern_key', name='uq_company_pattern')
    )
    
    # Create indexes for performance
    op.create_index('ix_quote_adjustment_log_quote_id', 'quote_adjustment_log', ['quote_id'])
    op.create_index('ix_quote_adjustment_log_company_id', 'quote_adjustment_log', ['company_id'])
    op.create_index('ix_quote_adjustment_log_item_ref', 'quote_adjustment_log', ['item_ref'])
    op.create_index('ix_auto_tuning_patterns_company_id', 'auto_tuning_patterns', ['company_id'])
    op.create_index('ix_auto_tuning_patterns_pattern_key', 'auto_tuning_patterns', ['pattern_key'])


def downgrade():
    """Drop quote adjustments and auto-tuning tables."""
    op.drop_index('ix_auto_tuning_patterns_pattern_key', 'auto_tuning_patterns')
    op.drop_index('ix_auto_tuning_patterns_company_id', 'auto_tuning_patterns')
    op.drop_index('ix_quote_adjustment_log_item_ref', 'quote_adjustment_log')
    op.drop_index('ix_quote_adjustment_log_company_id', 'quote_adjustment_log')
    op.drop_index('ix_quote_adjustment_log_quote_id', 'quote_adjustment_log')
    
    op.drop_table('auto_tuning_patterns')
    op.drop_table('quote_adjustment_log') 
