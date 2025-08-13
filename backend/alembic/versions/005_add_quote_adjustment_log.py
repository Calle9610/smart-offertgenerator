"""Add quote adjustment log table for tracking quantity changes

Revision ID: 005
Revises: 004
Create Date: 2025-08-12 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create quote_adjustment_log table with proper indexes."""
    # Create quote_adjustment_log table
    op.create_table('quote_adjustment_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('item_ref', sa.Text(), nullable=False),
        sa.Column('old_qty', sa.Numeric(12,2), nullable=False),
        sa.Column('new_qty', sa.Numeric(12,2), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_quote_adjustment_log_quote_id'), 'quote_adjustment_log', ['quote_id'], unique=False)
    op.create_index(op.f('ix_quote_adjustment_log_item_ref'), 'quote_adjustment_log', ['item_ref'], unique=False)
    
    # Add foreign key constraints
    op.create_foreign_key(None, 'quote_adjustment_log', 'quote', ['quote_id'], ['id'])


def downgrade() -> None:
    """Remove quote_adjustment_log table and related constraints."""
    # Drop foreign key constraints
    op.drop_constraint(None, 'quote_adjustment_log', type_='foreignkey')
    
    # Drop indexes
    op.drop_index(op.f('ix_quote_adjustment_log_item_ref'), table_name='quote_adjustment_log')
    op.drop_index(op.f('ix_quote_adjustment_log_quote_id'), table_name='quote_adjustment_log')
    
    # Drop table
    op.drop_table('quote_adjustment_log') 
