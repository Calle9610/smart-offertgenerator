"""add_quote_updated_at

Revision ID: 4b75f6540da4
Revises: 3b75f6540da3
Create Date: 2025-08-13 13:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4b75f6540da4'
down_revision = '3b75f6540da3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add updated_at column to quote table
    op.add_column('quote', sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')))


def downgrade() -> None:
    # Drop updated_at column from quote table
    op.drop_column('quote', 'updated_at') 
