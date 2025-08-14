"""Add unique index to generation_rule

Revision ID: 009
Revises: 008
Create Date: 2025-01-13 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '009_add_unique_index_to_generation_rule'
down_revision = '008_add_company_id_to_quote_adjustment_log'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add unique index on (company_id, key)
    op.create_index('ix_generation_rule_company_key', 'generation_rule', ['company_id', 'key'], unique=True)


def downgrade() -> None:
    # Drop unique index
    op.drop_index('ix_generation_rule_company_key', 'generation_rule')
