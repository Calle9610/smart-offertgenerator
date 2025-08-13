"""Add authentication and multi-tenancy

Revision ID: 002
Revises: 001
Create Date: 2025-08-12 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tenant table
    op.create_table('tenant',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('domain', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenant_domain'), 'tenant', ['domain'], unique=True)
    op.create_index(op.f('ix_tenant_name'), 'tenant', ['name'], unique=True)
    
    # Create user table
    op.create_table('user',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)
    op.create_index(op.f('ix_user_username'), 'user', ['username'], unique=True)
    
    # Add tenant_id to company table
    op.add_column('company', sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, 'company', 'tenant', ['tenant_id'], ['id'])
    
    # Add tenant_id and user_id to quote table
    op.add_column('quote', sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('quote', sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, 'quote', 'tenant', ['tenant_id'], ['id'])
    op.create_foreign_key(None, 'quote', 'user', ['user_id'], ['id'])


def downgrade() -> None:
    # Remove foreign keys and columns from quote table
    op.drop_constraint(None, 'quote', type_='foreignkey')
    op.drop_constraint(None, 'quote', type_='foreignkey')
    op.drop_column('quote', 'user_id')
    op.drop_column('quote', 'tenant_id')
    
    # Remove foreign key and column from company table
    op.drop_constraint(None, 'company', type_='foreignkey')
    op.drop_column('company', 'tenant_id')
    
    # Drop user table
    op.drop_index(op.f('ix_user_username'), table_name='user')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')
    
    # Drop tenant table
    op.drop_index(op.f('ix_tenant_name'), table_name='tenant')
    op.drop_index(op.f('ix_tenant_domain'), table_name='tenant')
    op.drop_table('tenant') 
