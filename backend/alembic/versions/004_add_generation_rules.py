"""Add generation rules table for auto-generating quote items

Revision ID: 004
Revises: 003
Create Date: 2025-08-12 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create generation_rule table with proper indexes."""
    # Create generation_rule table
    op.create_table('generation_rule',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.Text(), nullable=False),
        sa.Column('rules', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_generation_rule_company_id'), 'generation_rule', ['company_id'], unique=False)
    op.create_index(op.f('ix_generation_rule_key'), 'generation_rule', ['key'], unique=False)
    op.create_index(op.f('ix_generation_rule_company_key'), 'generation_rule', ['company_id', 'key'], unique=True)
    
    # Add foreign key constraints
    op.create_foreign_key(None, 'generation_rule', 'company', ['company_id'], ['id'])


def downgrade() -> None:
    """Remove generation_rule table and related constraints."""
    # Drop foreign key constraints
    op.drop_constraint(None, 'generation_rule', type_='foreignkey')
    
    # Drop indexes
    op.drop_index(op.f('ix_generation_rule_company_key'), table_name='generation_rule')
    op.drop_index(op.f('ix_generation_rule_key'), table_name='generation_rule')
    op.drop_index(op.f('ix_generation_rule_company_id'), table_name='generation_rule')
    
    # Drop table
    op.drop_table('generation_rule') 
