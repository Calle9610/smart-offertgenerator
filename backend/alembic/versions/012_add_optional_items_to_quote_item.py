"""Add optional items support to quote_item table

Revision ID: 012_add_optional_items
Revises: 011_fix_generation_rule_foreign_key
Create Date: 2025-08-14 20:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "012_add_optional_items"
down_revision = "011_fix_generation_rule_foreign_key"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add optional items support to quote_item table."""
    
    # Add is_optional boolean field with default false
    op.add_column(
        "quote_item",
        sa.Column("is_optional", sa.Boolean(), nullable=False, server_default="false")
    )
    
    # Add option_group text field for grouping exclusive choices
    op.add_column(
        "quote_item",
        sa.Column("option_group", sa.Text(), nullable=True)
    )
    
    # Add index on option_group for better query performance
    op.create_index(
        "ix_quote_item_option_group",
        "quote_item",
        ["option_group"]
    )


def downgrade() -> None:
    """Remove optional items support from quote_item table."""
    
    # Drop the index
    op.drop_index("ix_quote_item_option_group", "quote_item")
    
    # Drop the columns
    op.drop_column("quote_item", "option_group")
    op.drop_column("quote_item", "is_optional")
