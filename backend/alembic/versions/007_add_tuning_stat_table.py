"""Add tuning_stat table

Revision ID: 007
Revises: 5b75f6540da5
Create Date: 2025-01-13 23:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_add_tuning_stat_table'
down_revision = '5b75f6540da5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tuning_stat table
    op.create_table('tuning_stat',
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.Text(), nullable=False),
        sa.Column('item_ref', sa.Text(), nullable=False),
        sa.Column('median_factor', sa.Numeric(precision=8, scale=3), nullable=False, server_default='1.000'),
        sa.Column('n', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('company_id', 'key', 'item_ref')
    )
    
    # Create index on company_id for performance
    op.create_index('ix_tuning_stat_company_id', 'tuning_stat', ['company_id'])


def downgrade() -> None:
    # Drop table
    op.drop_index('ix_tuning_stat_company_id', 'tuning_stat')
    op.drop_table('tuning_stat')
