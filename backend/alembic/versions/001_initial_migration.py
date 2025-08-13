"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2025-08-12 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create company table
    op.create_table('company',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create price_profile table
    op.create_table('price_profile',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('currency', sa.String(), nullable=False),
        sa.Column('vat_rate', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create labor_rate table
    op.create_table('labor_rate',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
        sa.ForeignKeyConstraint(['profile_id'], ['price_profile.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create material table
    op.create_table('material',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('sku', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('unit_cost', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('markup_pct', sa.Numeric(precision=6, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
        sa.ForeignKeyConstraint(['profile_id'], ['price_profile.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create quote table
    op.create_table('quote',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_name', sa.String(), nullable=False),
        sa.Column('project_name', sa.String(), nullable=True),
        sa.Column('profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('currency', sa.String(), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), server_default='0', nullable=True),
        sa.Column('vat', sa.Numeric(precision=12, scale=2), server_default='0', nullable=True),
        sa.Column('total', sa.Numeric(precision=12, scale=2), server_default='0', nullable=True),
        sa.Column('status', sa.String(), server_default='draft', nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
        sa.ForeignKeyConstraint(['profile_id'], ['price_profile.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create quote_item table
    op.create_table('quote_item',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('ref', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('qty', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('unit', sa.String(), nullable=True),
        sa.Column('unit_price', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('line_total', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['quote_id'], ['quote.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('quote_item')
    op.drop_table('quote')
    op.drop_table('material')
    op.drop_table('labor_rate')
    op.drop_table('price_profile')
    op.drop_table('company') 
