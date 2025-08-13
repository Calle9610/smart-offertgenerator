"""Add company_id to quote_adjustment_log

Revision ID: 008
Revises: 007
Create Date: 2025-01-13 23:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add company_id column to quote_adjustment_log
    op.add_column('quote_adjustment_log', sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_quote_adjustment_log_company_id',
        'quote_adjustment_log', 'company',
        ['company_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # Make company_id not nullable after adding the constraint
    op.alter_column('quote_adjustment_log', 'company_id', nullable=False)


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint('fk_quote_adjustment_log_company_id', 'quote_adjustment_log', type_='foreignkey')
    
    # Drop company_id column
    op.drop_column('quote_adjustment_log', 'company_id')
