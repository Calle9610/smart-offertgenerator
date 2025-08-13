"""add_quote_packages

Revision ID: 5b75f6540da5
Revises: 4b75f6540da4
Create Date: 2025-08-13 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '5b75f6540da5'
down_revision = '4b75f6540da4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create quote_package table first
    op.create_table('quote_package',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=sa.text('gen_random_uuid()')),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('items', postgresql.JSONB(), nullable=False),
        sa.Column('subtotal', sa.Numeric(12, 2), nullable=True),
        sa.Column('vat', sa.Numeric(12, 2), nullable=True),
        sa.Column('total', sa.Numeric(12, 2), nullable=True),
        sa.Column('is_default', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['quote_id'], ['quote.id'], ondelete='CASCADE')
    )
    
    # Create index on (quote_id, name)
    op.create_index('ix_quote_package_quote_id_name', 'quote_package', ['quote_id', 'name'])
    
    # Now add accepted_package_id column to quote table
    op.add_column('quote', sa.Column('accepted_package_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Add foreign key constraint for accepted_package_id
    op.create_foreign_key(
        'fk_quote_accepted_package_id',
        'quote', 'quote_package',
        ['accepted_package_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Drop foreign key constraint
    op.drop_constraint('fk_quote_accepted_package_id', 'quote', type_='foreignkey')
    
    # Drop accepted_package_id column from quote table
    op.drop_column('quote', 'accepted_package_id')
    
    # Drop index
    op.drop_index('ix_quote_package_quote_id_name', 'quote_package')
    
    # Drop quote_package table
    op.drop_table('quote_package') 
