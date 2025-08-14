"""Add index to quote_adjustment_log

Revision ID: 010
Revises: 009
Create Date: 2025-01-13 23:35:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '010_add_index_to_quote_adjustment_log'
down_revision = '009_add_unique_index_to_generation_rule'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add index on (quote_id, created_at)
    op.create_index('ix_quote_adjustment_log_quote_created', 'quote_adjustment_log', ['quote_id', 'created_at'])


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_quote_adjustment_log_quote_created', 'quote_adjustment_log')
