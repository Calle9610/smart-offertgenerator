"""Add project requirements table

Revision ID: 003
Revises: 002_add_auth_and_tenancy
Create Date: 2025-08-12 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create project_requirements table with proper indexes."""
    # Create project_requirements table
    op.create_table('project_requirements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quote_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_project_requirements_company_id'), 'project_requirements', ['company_id'], unique=False)
    op.create_index(op.f('ix_project_requirements_quote_id'), 'project_requirements', ['quote_id'], unique=False)
    op.create_index(op.f('ix_project_requirements_created_at'), 'project_requirements', ['created_at'], unique=False)
    
    # Add foreign key constraints
    op.create_foreign_key(None, 'project_requirements', 'company', ['company_id'], ['id'])
    op.create_foreign_key(None, 'project_requirements', 'quote', ['quote_id'], ['id'])


def downgrade() -> None:
    """Remove project_requirements table and related constraints."""
    # Drop foreign key constraints
    op.drop_constraint(None, 'project_requirements', type_='foreignkey')
    op.drop_constraint(None, 'project_requirements', type_='foreignkey')
    
    # Drop indexes
    op.drop_index(op.f('ix_project_requirements_created_at'), table_name='project_requirements')
    op.drop_index(op.f('ix_project_requirements_quote_id'), table_name='project_requirements')
    op.drop_index(op.f('ix_project_requirements_company_id'), table_name='project_requirements')
    
    # Drop table
    op.drop_table('project_requirements') 
