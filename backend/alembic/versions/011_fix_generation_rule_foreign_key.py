"""Fix generation_rule foreign key constraint

Revision ID: 011
Revises: 010
Create Date: 2025-01-13 23:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '011_fix_generation_rule_foreign_key'
down_revision = '010_add_index_to_quote_adjustment_log'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop existing foreign key constraint
    op.drop_constraint('generation_rule_company_id_fkey', 'generation_rule', type_='foreignkey')
    
    # Add new foreign key constraint with ON DELETE CASCADE
    op.create_foreign_key(
        'generation_rule_company_id_fkey',
        'generation_rule', 'company',
        ['company_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop new foreign key constraint
    op.drop_constraint('generation_rule_company_id_fkey', 'generation_rule', type_='foreignkey')
    
    # Add back old foreign key constraint without CASCADE
    op.create_foreign_key(
        'generation_rule_company_id_fkey',
        'generation_rule', 'company',
        ['company_id'], ['id']
    )
